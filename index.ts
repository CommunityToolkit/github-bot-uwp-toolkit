import * as querystring from 'querystring';
import * as https from 'https';

import cron = require('node-cron');

// Types definition
type IssueNode = {
    id: string;
    author: {
        login: string
    };
    createdAt: string;
    comments: {
        totalCount: number
    };
    lastComment: {
        edges: {
            node: {
                updatedAt: string
            }
        }[];
    };
    lastTwoComments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
    commentAuthors: {
        edges: {
            node: {
                author: {
                    login: string
                },
            }
        }[];
    };
    labels: {
        edges: {
            node: {
                name: string
            }
        }[];
    };
}

// GitHub Api calls

const closeGitHubIssue = (headers: any, issueId: string) => {
    performGitHubGraphqlRequest(headers, {
        query: closeGitHubIssueMutation(issueId)
    });
}

const closeGitHubIssueMutation = (issueId: string): string => {
    return `
      mutation {
        closeIssue(input: { subjectId: "${issueId}" }) {
          subject {
            id
          }
        }
      }`;
}

const commentGitHubIssue = (headers: any, issueId: string, comment: string) => {
    performGitHubGraphqlRequest(headers, {
        query: commentGitHubIssueMutation(issueId, comment)
    });
}

const commentGitHubIssueMutation = (issueId: string, comment: string): string => {
    return `
      mutation {
        addComment(input: { subjectId: "${issueId}", body: "${comment}" }) {
          subject {
            id
          }
        }
      }`;
}

const getAllGitHubIssuesRecursively = (headers: any, repoOwner: string, repoName: string, afterCursor: string, callback: (issues: IssueNode[]) => any) => {
    performGitHubGraphqlRequest(headers, {
        query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor)
    }, (response) => {
        if (response.data.repository.issues.pageInfo.hasNextPage) {
            getAllGitHubIssuesRecursively(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, (issues) => {
                callback(issues.concat(response.data.repository.issues.edges.map(edge => edge.node)));
            });
        } else {
            callback(response.data.repository.issues.edges.map(edge => edge.node));
        }
    });
}

const getGitHubIssuesQuery = (repoOwner: string, repoName: string, afterCursor?: string): string => {
    return `
      query { 
        repository(owner: "${repoOwner}", name: "${repoName}") { 
          issues(states: [OPEN], first: 50${!!afterCursor ? `, after: "${afterCursor}"` : ''}) {
            pageInfo {
              hasNextPage,
              endCursor
            },
            edges {
              node {
                id,
                author {
                  login
                },
                createdAt,
                comments {
                    totalCount
                },
                lastComment: comments(last: 1) {
                    edges {
                      node {
                        updatedAt
                      }
                  }
                },
                lastTwoComments: comments(last: 2) {
                  edges {
                    node {
                      author {
                        login
                      },
                      body
                    }
                  }
                },
                commentAuthors: comments(first: 100) {
                  edges {
                    node {
                      author {
                        login
                      }
                    }
                  }
                },
                labels(first: 10) {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }`;
}

const performGitHubGraphqlRequest = (headers: any, data: any, success?: (response: any) => any) => {
    performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
}

// Http utils

const performHttpRequest = (host: string, endpoint: string, method: 'GET' | 'POST', headers: any, data: any, success: (response: any) => any) => {
    const dataString = JSON.stringify(data);
    let requestHeaders = { ...headers };

    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    } else {
        requestHeaders = {
            ...requestHeaders,
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }

    const options = {
        host: host,
        path: endpoint,
        method: method,
        headers: requestHeaders
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf-8');

        let responseString = '';

        res.on('data', (data) => {
            responseString += data;
        });

        res.on('end', () => {
            const responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });

    req.write(dataString);
    req.end();
}

// Array utils

const distinct = (array: any[]): any[] => {
    return array.filter((x, i, a) => {
        return a.indexOf(x) === i;
    });
}

// Data utils

const addDays = (date: Date, days: number): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() + days);
    return newDate;
}

// Bot logic

// pull-requests - TODO : should send a message of linked non-closed issues when a PR is merged
// TODO : only merged PR
// TODO : do not send a new message if one has already been added
// TODO : check if there are unclosed issues linked to the PR
// TODO : send a message with links to unclosed issues

// issues - should detect if there was no response from the community after a period of time
const detectIfNoResponseFromCommunity = (githubApiHeaders: any, issue: IssueNode, exclusiveLabels: string[]) => {
    // check if there is only one user who write a message (the creator of the message)
    const loginsOfAuthors: string[] = distinct(issue.commentAuthors.edges.map(edge => edge.node.author.login));
    const issueHasNoResponse = distinct(loginsOfAuthors.filter(c => c !== issue.author.login)).length === 0;

    if (issueHasNoResponse) {
        // check if the issue contains an exclusive labels (only issues without those labels are usable)
        const containsExclusiveLabels = issue.labels.edges.map(edge => edge.node).filter(label => {
            return exclusiveLabels.some(l => l === label.name);
        }).length > 0;

        if (!containsExclusiveLabels) {
            // check if the issue was created 7 days ago
            const today = new Date();

            if (new Date(issue.createdAt) < addDays(today, -7)) {
                // send a message with a ping to the team
                commentGitHubIssue(githubApiHeaders, issue.id, `No response from the community. ping @nmetulev`);
            }
        }
    }
}

// issues - should send a reminder after a period of time, up to 2 successive alerts
const sendReminderAfterAPeriodOfTime = (githubApiHeaders: any, botUsername: string, issue: IssueNode, exclusiveLabels: string[]) => {
    // check if at least two users write a message (one user other than the author)
    const loginsOfAuthors: string[] = distinct(issue.commentAuthors.edges.map(edge => edge.node.author.login));
    const issueHasResponse = distinct(loginsOfAuthors.filter(c => c !== issue.author.login)).length > 0;

    if (issueHasResponse) {
        // check if the issue contains an exclusive labels (only issues without those labels are usable)
        const containsExclusiveLabels = issue.labels.edges.map(edge => edge.node).filter(label => {
            return exclusiveLabels.some(l => l === label.name);
        }).length > 0;

        if (!containsExclusiveLabels) {
            // check if last message was sent 7 days ago
            const lastComment = issue.lastComment.edges[0];
            const today = new Date();

            if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -7)) {
                // less than 3 messages or
                // check if last messages of the issue contains less than 2 successive messages of the bot
                const lastTwoMessages = issue.lastTwoComments.edges.map(edge => edge.node);
                const reminderMessagesFromBot = lastTwoMessages.filter(c => {
                    return (c.author.login === botUsername && c.body.indexOf('This issue seems inactive') > -1);
                });

                if (issue.comments.totalCount < 3 || reminderMessagesFromBot.length < 2) {
                    // send a message to the creator that issue will be close in X days
                    const daysBeforeClosingIssue = 7 * (2 - reminderMessagesFromBot.length);

                    commentGitHubIssue(
                        githubApiHeaders,
                        issue.id,
                        `This issue seems inactive. It will automatically be closed in ${daysBeforeClosingIssue} days if there is no activity.`);
                }
            }
        }
    }
}

// issues - should close inactive issue after 3 successive alerts
const closeInactiveIssueAfterThreeSuccessiveAlerts = (githubApiHeaders: any, botUsername: string, issue: IssueNode, exclusiveLabels: string[]) => {
    // check if at least two users write a message (one user other than the author)
    const loginsOfAuthors: string[] = distinct(issue.commentAuthors.edges.map(edge => edge.node.author.login));
    const issueHasResponse = distinct(loginsOfAuthors.filter(c => c !== issue.author.login)).length > 0;

    if (issueHasResponse) {
        // check if the issue contains an exclusive labels (only issues without those labels are usable)
        const containsExclusiveLabels = issue.labels.edges.map(edge => edge.node).filter(label => {
            return exclusiveLabels.some(l => l === label.name);
        }).length > 0;

        if (!containsExclusiveLabels) {
            // check if last message was sent 7 days ago
            const lastComment = issue.lastComment.edges[0];
            const today = new Date();

            if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -7)) {
                // check if last messages of the issue contains exactly 2 successive messages of the bot
                const lastTwoMessages = issue.lastTwoComments.edges.map(edge => edge.node);
                const reminderMessagesFromBot = lastTwoMessages.filter(c => {
                    return (c.author.login === botUsername && c.body.indexOf('This issue seems inactive') > -1);
                });

                if (reminderMessagesFromBot.length === 2) {
                    // close issue and send a message that issue got no answer from the creator
                    commentGitHubIssue(
                        githubApiHeaders,
                        issue.id,
                        'Issue is inactive. It was automatically closed.');

                    closeGitHubIssue(githubApiHeaders, issue.id);
                }
            }
        }
    }
}

// Main logic

const start = (username: string, personalAccessToken: string, repoOwner: string, repoName: string) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + personalAccessToken
    };

    getAllGitHubIssuesRecursively(githubApiHeaders, repoOwner, repoName, null, (issues) => {
        const exclusiveLabels = ['PR in progress', 'work in progress'];

        issues.forEach(issue => {
            detectIfNoResponseFromCommunity(githubApiHeaders, issue, exclusiveLabels);
            sendReminderAfterAPeriodOfTime(githubApiHeaders, username, issue, exclusiveLabels);
            closeInactiveIssueAfterThreeSuccessiveAlerts(githubApiHeaders, username, issue, exclusiveLabels);
        })
    });
}

// execute CRON task every hour
cron.schedule('0 * * * *', () => {
    console.log('start task');
    start(
        process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME,
        process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME
    );
});
console.log('schedule created');
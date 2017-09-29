import { performHttpRequest } from './http';
import { IssueNode, PullRequestNode, IssueOrPullRequestLinkNode } from './models';

// private functions

const performGitHubGraphqlRequest = (headers: any, data: any, success?: (response: any) => any) => {
    performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
}

// queries

export const getAllGitHubIssuesRecursively = (headers: any, repoOwner: string, repoName: string, afterCursor: string, callback: (issues: IssueNode[]) => any) => {
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

export const getPullRequest = (headers: any, repoOwner: string, repoName: string, id: number, callback: (pr: PullRequestNode) => any) => {
    performGitHubGraphqlRequest(headers, {
        query: getPullRequestQuery(repoOwner, repoName, id)
    }, (response) => {
        callback(response.data.repository.pullRequest);
    });
}
const getPullRequestQuery = (repoOwner: string, repoName: string, id: number): string => {
    return `
      query { 
        repository(owner: "${repoOwner}", name: "${repoName}") { 
          pullRequest(number: ${id}) {
            id,
            body,
            comments(first: 100) {
              edges {
                node {
                  author {
                    login
                  },
                  body
                }
              }
            }
          }
        }
      }`;
}

export const getIssueOrPullRequestLinks = (headers: any, repoOwner: string, repoName: string, numbers: number[], callback: (nodes: IssueOrPullRequestLinkNode[]) => any) => {
    performGitHubGraphqlRequest(headers, {
        query: getIssueOrPullRequestLinksQuery(repoOwner, repoName, numbers)
    }, (response) => {
        const results = numbers.map((_, index) => response.data.repository['result' + index]);
        callback(results);
    });
}
const getIssueOrPullRequestLinksQuery = (repoOwner: string, repoName: string, numbers: number[]) => {
    const resultList = numbers
        .map((n, index) => {
            return `
              result${index}: issueOrPullRequest(number: ${n}) {
                __typename
                ... on Issue {
                  id,
                  number,
                  closed
                }
              }`;
        })
        .join(',');

    return `
      query {
        repository(owner: "${repoOwner}", name: "${repoName}") {
          ${resultList}
        }
      }`;
}

// mutations

export const commentGitHubIssue = (headers: any, issueId: string, comment: string) => {
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

// TODO : this mutation is not currently available - should use the REST API 
export const closeGitHubIssue = (headers: any, issueId: string) => {
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
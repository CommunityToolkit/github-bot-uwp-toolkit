"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var querystring = require("querystring");
var https = require("https");
var cron = require("node-cron");
var closeGitHubIssue = function (headers, issueId) {
    performGitHubGraphqlRequest(headers, {
        query: closeGitHubIssueMutation(issueId)
    });
};
var closeGitHubIssueMutation = function (issueId) {
    return "\n      mutation {\n        closeIssue(input: { subjectId: \"" + issueId + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
var commentGitHubIssue = function (headers, issueId, comment) {
    performGitHubGraphqlRequest(headers, {
        query: commentGitHubIssueMutation(issueId, comment)
    });
};
var commentGitHubIssueMutation = function (issueId, comment) {
    return "\n      mutation {\n        addComment(input: { subjectId: \"" + issueId + "\", body: \"" + comment + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
var getAllGitHubIssuesRecursively = function (headers, repoOwner, repoName, afterCursor, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor)
    }, function (response) {
        if (response.data.repository.issues.pageInfo.hasNextPage) {
            getAllGitHubIssuesRecursively(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, function (issues) {
                callback(issues.concat(response.data.repository.issues.edges.map(function (edge) { return edge.node; })));
            });
        }
        else {
            callback(response.data.repository.issues.edges.map(function (edge) { return edge.node; }));
        }
    });
};
var getGitHubIssuesQuery = function (repoOwner, repoName, afterCursor) {
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          issues(states: [OPEN], first: 50" + (!!afterCursor ? ", after: \"" + afterCursor + "\"" : '') + ") {\n            pageInfo {\n              hasNextPage,\n              endCursor\n            },\n            edges {\n              node {\n                id,\n                author {\n                  login\n                },\n                createdAt,\n                comments {\n                    totalCount\n                },\n                lastComment: comments(last: 1) {\n                    edges {\n                      node {\n                        updatedAt\n                      }\n                  }\n                },\n                lastTwoComments: comments(last: 2) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      },\n                      body\n                    }\n                  }\n                },\n                commentAuthors: comments(first: 100) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      }\n                    }\n                  }\n                },\n                labels(first: 10) {\n                  edges {\n                    node {\n                      name\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }";
};
var getAllMergedPullRequestsRecursively = function (headers, repoOwner, repoName, afterCursor, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getMergedPullRequestsQuery(repoOwner, repoName, afterCursor)
    }, function (response) {
        if (response.data.repository.pullRequests.pageInfo.hasNextPage) {
            getAllMergedPullRequestsRecursively(headers, repoOwner, repoName, response.data.repository.pullRequests.pageInfo.endCursor, function (pullRequests) {
                callback(pullRequests.concat(response.data.repository.pullRequests.edges.map(function (edge) { return edge.node; })));
            });
        }
        else {
            callback(response.data.repository.pullRequests.edges.map(function (edge) { return edge.node; }));
        }
    });
};
var getMergedPullRequestsQuery = function (repoOwner, repoName, afterCursor) {
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          pullRequests(states: [MERGED], first: 50" + (!!afterCursor ? ", after: \"" + afterCursor + "\"" : '') + ") {\n            pageInfo {\n              hasNextPage,\n              endCursor\n            },\n            edges {\n              node {\n                id,\n                comments(first: 100) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      },\n                      body\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }";
};
var getIssueOrPullRequestLinks = function (headers, repoOwner, repoName, numbers, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getIssueOrPullRequestLinksQuery(repoOwner, repoName, numbers)
    }, function (response) {
        var results = numbers.map(function (_, index) { return response.data.repository['result' + index]; });
        callback(results);
    });
};
var getIssueOrPullRequestLinksQuery = function (repoOwner, repoName, numbers) {
    var resultList = numbers
        .map(function (n, index) {
        return "\n              result" + index + ": issueOrPullRequest(number: " + n + ") {\n                __typename\n                ... on Issue {\n                  id,\n                  number,\n                  closed\n                }\n              }";
    })
        .join(',');
    return "\n      query {\n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") {\n          " + resultList + "\n        }\n      }";
};
var performGitHubGraphqlRequest = function (headers, data, success) {
    performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
};
var performHttpRequest = function (host, endpoint, method, headers, data, success) {
    var dataString = JSON.stringify(data);
    var requestHeaders = __assign({}, headers);
    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    }
    else {
        requestHeaders = __assign({}, requestHeaders, { 'Content-Type': 'application/json', 'Content-Length': dataString.length });
    }
    var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: requestHeaders
    };
    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });
        res.on('end', function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });
    req.write(dataString);
    req.end();
};
var distinct = function (array) {
    return array.filter(function (x, i, a) {
        return a.indexOf(x) === i;
    });
};
var addDays = function (date, days) {
    var newDate = new Date();
    newDate.setDate(date.getDate() + days);
    return newDate;
};
var searchLinkedItemsNumbersInComment = function (message) {
    var matches = message.match(/[#][0-9]+/g);
    if (matches) {
        return matches.map(function (m) { return parseInt(m.trim().substr(1)); });
    }
    return [];
};
var sendMessageWithLinkedNonClosedIssuesForMergedPullRequest = function (githubApiHeaders, botUsername, repoOwner, repoName, pullRequest) {
    var hasAlreadyGotTheMessage = pullRequest.comments.edges.map(function (edge) { return edge.node; }).filter(function (c) {
        return (c.author.login === botUsername && c.body.indexOf('This PR is linked to unclosed issues.') > -1);
    }).length > 0;
    if (!hasAlreadyGotTheMessage) {
        var linkedItemsNumbers = pullRequest.comments.edges.map(function (edge) { return edge.node; })
            .map(function (c) {
            return searchLinkedItemsNumbersInComment(c.body);
        })
            .reduce(function (a, b) { return a.concat(b); }, []);
        var distinctLinkedItemsNumbers = distinct(linkedItemsNumbers);
        if (distinctLinkedItemsNumbers.length > 0) {
            getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, distinctLinkedItemsNumbers, function (results) {
                var unclosedIssuesNumber = results
                    .filter(function (r) { return r.__typename === 'Issue' && r.closed === false; })
                    .map(function (r) { return r.__typename === 'Issue' ? r.number : null; })
                    .filter(function (n) { return !!n; });
                var linkedItemsMessagePart = unclosedIssuesNumber.map(function (n) { return '#' + n; }).join(', ');
                commentGitHubIssue(githubApiHeaders, pullRequest.id, "This PR is linked to unclosed issues. Please check if one of these issues should be closed: " + linkedItemsMessagePart);
            });
        }
    }
};
var detectIfNoResponseFromCommunity = function (githubApiHeaders, issue, exclusiveLabels) {
    var loginsOfAuthors = distinct(issue.commentAuthors.edges.map(function (edge) { return edge.node.author.login; }));
    var issueHasNoResponse = distinct(loginsOfAuthors.filter(function (c) { return c !== issue.author.login; })).length === 0;
    if (issueHasNoResponse) {
        var containsExclusiveLabels = issue.labels.edges.map(function (edge) { return edge.node; }).filter(function (label) {
            return exclusiveLabels.some(function (l) { return l === label.name; });
        }).length > 0;
        if (!containsExclusiveLabels) {
            var today = new Date();
            if (new Date(issue.createdAt) < addDays(today, -7)) {
                commentGitHubIssue(githubApiHeaders, issue.id, "No response from the community. ping @nmetulev");
            }
        }
    }
};
var sendReminderAfterAPeriodOfTime = function (githubApiHeaders, botUsername, issue, exclusiveLabels) {
    var loginsOfAuthors = distinct(issue.commentAuthors.edges.map(function (edge) { return edge.node.author.login; }));
    var issueHasResponse = distinct(loginsOfAuthors.filter(function (c) { return c !== issue.author.login; })).length > 0;
    if (issueHasResponse) {
        var containsExclusiveLabels = issue.labels.edges.map(function (edge) { return edge.node; }).filter(function (label) {
            return exclusiveLabels.some(function (l) { return l === label.name; });
        }).length > 0;
        if (!containsExclusiveLabels) {
            var lastComment = issue.lastComment.edges[0];
            var today = new Date();
            if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -7)) {
                var lastTwoMessages = issue.lastTwoComments.edges.map(function (edge) { return edge.node; });
                var reminderMessagesFromBot = lastTwoMessages.filter(function (c) {
                    return (c.author.login === botUsername && c.body.indexOf('This issue seems inactive') > -1);
                });
                if (issue.comments.totalCount < 3 || reminderMessagesFromBot.length < 2) {
                    var daysBeforeClosingIssue = 7 * (2 - reminderMessagesFromBot.length);
                    commentGitHubIssue(githubApiHeaders, issue.id, "This issue seems inactive. It will automatically be closed in " + daysBeforeClosingIssue + " days if there is no activity.");
                }
            }
        }
    }
};
var closeInactiveIssueAfterThreeSuccessiveAlerts = function (githubApiHeaders, botUsername, issue, exclusiveLabels) {
    var loginsOfAuthors = distinct(issue.commentAuthors.edges.map(function (edge) { return edge.node.author.login; }));
    var issueHasResponse = distinct(loginsOfAuthors.filter(function (c) { return c !== issue.author.login; })).length > 0;
    if (issueHasResponse) {
        var containsExclusiveLabels = issue.labels.edges.map(function (edge) { return edge.node; }).filter(function (label) {
            return exclusiveLabels.some(function (l) { return l === label.name; });
        }).length > 0;
        if (!containsExclusiveLabels) {
            var lastComment = issue.lastComment.edges[0];
            var today = new Date();
            if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -7)) {
                var lastTwoMessages = issue.lastTwoComments.edges.map(function (edge) { return edge.node; });
                var reminderMessagesFromBot = lastTwoMessages.filter(function (c) {
                    return (c.author.login === botUsername && c.body.indexOf('This issue seems inactive') > -1);
                });
                if (reminderMessagesFromBot.length === 2) {
                    commentGitHubIssue(githubApiHeaders, issue.id, 'Issue is inactive. It was automatically closed.');
                    closeGitHubIssue(githubApiHeaders, issue.id);
                }
            }
        }
    }
};
var start = function (username, personalAccessToken, repoOwner, repoName) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + personalAccessToken
    };
    getAllGitHubIssuesRecursively(githubApiHeaders, repoOwner, repoName, null, function (issues) {
        var exclusiveLabels = ['PR in progress', 'work in progress'];
        issues.forEach(function (issue) {
            detectIfNoResponseFromCommunity(githubApiHeaders, issue, exclusiveLabels);
            sendReminderAfterAPeriodOfTime(githubApiHeaders, username, issue, exclusiveLabels);
            closeInactiveIssueAfterThreeSuccessiveAlerts(githubApiHeaders, username, issue, exclusiveLabels);
            getAllMergedPullRequestsRecursively(githubApiHeaders, repoOwner, repoName, null, function (pullRequests) {
                pullRequests.forEach(function (pr) {
                    sendMessageWithLinkedNonClosedIssuesForMergedPullRequest(githubApiHeaders, username, repoOwner, repoName, pr);
                });
            });
        });
    });
};
cron.schedule('0 * * * *', function () {
    console.log('start task');
    start(process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME, process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME);
});
console.log('schedule created');
//# sourceMappingURL=index.js.map
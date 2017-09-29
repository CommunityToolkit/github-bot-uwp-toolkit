"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("./http");
var performGitHubGraphqlRequest = function (headers, data, success) {
    http_1.performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
};
exports.getAllGitHubIssuesRecursively = function (headers, repoOwner, repoName, afterCursor, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor)
    }, function (response) {
        if (response.data.repository.issues.pageInfo.hasNextPage) {
            exports.getAllGitHubIssuesRecursively(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, function (issues) {
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
exports.getPullRequest = function (headers, repoOwner, repoName, id, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getPullRequestQuery(repoOwner, repoName, id)
    }, function (response) {
        callback(response.data.repository.pullRequest);
    });
};
var getPullRequestQuery = function (repoOwner, repoName, id) {
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          pullRequest(number: " + id + ") {\n            id,\n            body,\n            comments(first: 100) {\n              edges {\n                node {\n                  author {\n                    login\n                  },\n                  body\n                }\n              }\n            }\n          }\n        }\n      }";
};
exports.getIssueOrPullRequestLinks = function (headers, repoOwner, repoName, numbers, callback) {
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
exports.commentGitHubIssue = function (headers, issueId, comment) {
    performGitHubGraphqlRequest(headers, {
        query: commentGitHubIssueMutation(issueId, comment)
    });
};
var commentGitHubIssueMutation = function (issueId, comment) {
    return "\n      mutation {\n        addComment(input: { subjectId: \"" + issueId + "\", body: \"" + comment + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
exports.closeGitHubIssue = function (headers, issueId) {
    performGitHubGraphqlRequest(headers, {
        query: closeGitHubIssueMutation(issueId)
    });
};
var closeGitHubIssueMutation = function (issueId) {
    return "\n      mutation {\n        closeIssue(input: { subjectId: \"" + issueId + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
//# sourceMappingURL=github.js.map
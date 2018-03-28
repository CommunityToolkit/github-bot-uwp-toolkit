"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("./http");
var performGitHubGraphqlRequest = function (headers, data, success) {
    http_1.performHttpRequest('api.github.com', '/graphql', 'POST', headers, data, success);
};
var performGitHubRestRequest = function (headers, route, method, data, success) {
    http_1.performHttpRequest('api.github.com', route, method, headers, data, success);
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
exports.getAllGitHubIssuesRecursivelyFilterWithLabels = function (headers, repoOwner, repoName, afterCursor, labels, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getGitHubIssuesQuery(repoOwner, repoName, afterCursor, labels)
    }, function (response) {
        if (response.data.repository.issues.pageInfo.hasNextPage) {
            exports.getAllGitHubIssuesRecursivelyFilterWithLabels(headers, repoOwner, repoName, response.data.repository.issues.pageInfo.endCursor, labels, function (issues) {
                callback(issues.concat(response.data.repository.issues.edges.map(function (edge) { return edge.node; })));
            });
        }
        else {
            callback(response.data.repository.issues.edges.map(function (edge) { return edge.node; }));
        }
    });
};
var getGitHubIssuesQuery = function (repoOwner, repoName, afterCursor, labels) {
    var variables = [
        {
            name: 'first',
            value: 50
        },
        {
            name: 'after',
            value: afterCursor ? "\"" + afterCursor + "\"" : null
        },
        {
            name: 'labels',
            value: labels ? JSON.stringify(labels) : null
        }
    ];
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          issues(states: [OPEN], " + variables.filter(function (v) { return !!v; }).map(function (v) { return v.name + ": " + v.value; }).join(', ') + ") {\n            pageInfo {\n              hasNextPage,\n              endCursor\n            },\n            edges {\n              node {\n                id,\n                number,\n                author {\n                  login\n                },\n                createdAt,\n                comments {\n                    totalCount\n                },\n                lastComment: comments(last: 1) {\n                    edges {\n                      node {\n                        updatedAt\n                      }\n                  }\n                },\n                lastTwoComments: comments(last: 2) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      },\n                      body\n                    }\n                  }\n                },\n                commentAuthors: comments(first: 100) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      }\n                    }\n                  }\n                },\n                labels(first: 10) {\n                  edges {\n                    node {\n                      name\n                    }\n                  }\n                },\n                milestone {\n                  number,\n                  state\n                }\n              }\n            }\n          }\n        }\n      }";
};
exports.getPullRequest = function (headers, repoOwner, repoName, number, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getPullRequestQuery(repoOwner, repoName, number)
    }, function (response) {
        callback(response.data.repository.pullRequest);
    });
};
var getPullRequestQuery = function (repoOwner, repoName, number) {
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          pullRequest(number: " + number + ") {\n            id,\n            body,\n            comments(first: 100) {\n              edges {\n                node {\n                  author {\n                    login\n                  },\n                  body\n                }\n              }\n            }\n          }\n        }\n      }";
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
exports.getAllMilestones = function (headers, repoOwner, repoName, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getAllMilestonesQuery(repoOwner, repoName)
    }, function (response) {
        callback(response.data.repository.milestones.edges.map(function (edge) { return edge.node; }));
    });
};
var getAllMilestonesQuery = function (repoOwner, repoName) {
    return "\n    query {\n      repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") {\n        milestones(first: 100) {\n          edges {\n            node {\n              id,\n              state,\n              dueOn,\n              number\n            }\n          }\n        }\n      }\n    }";
};
exports.getAllOpenPullRequests = function (headers, repoOwner, repoName, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getAllOpenPullRequestsQuery(repoOwner, repoName)
    }, function (response) {
        callback(response.data.repository.pullRequests.edges.map(function (edge) { return edge.node; }));
    });
};
var getAllOpenPullRequestsQuery = function (repoOwner, repoName) {
    return "\n      query { \n        repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") { \n          pullRequests(states: [OPEN], first: 100) {\n            edges {\n              node {\n                id,\n                number,\n                author {\n                  login\n                },\n                createdAt,\n                comments {\n                  totalCount\n                },\n                lastComment: comments(last: 1) {\n                  edges {\n                    node {\n                      updatedAt\n                    }\n                  }\n                },\n                lastTwoComments: comments(last: 2) {\n                  edges {\n                    node {\n                      author {\n                        login\n                      },\n                      body\n                    }\n                  }\n                },\n                reviews(last: 10) {\n                  edges {\n                    node {\n                      updatedAt\n                    }\n                  }\n                },\n                labels(first: 10) {\n                  edges {\n                    node {\n                      name\n                    }\n                  }\n                },\n                milestone {\n                  number\n                }\n              }\n            }\n          }\n        }\n      }";
};
exports.getIssuesLabels = function (headers, repoOwner, repoName, numbers, callback) {
    performGitHubGraphqlRequest(headers, {
        query: getIssuesLabelsQuery(repoOwner, repoName, numbers)
    }, function (response) {
        var results = numbers
            .map(function (n, index) { return ({
            number: n,
            labels: response.data.repository['result' + index].labels.edges.map(function (edge) { return edge.node.name; })
        }); });
        callback(results);
    });
};
var getIssuesLabelsQuery = function (repoOwner, repoName, numbers) {
    var resultList = numbers
        .map(function (n, index) {
        return "\n            result" + index + ": issue(number: " + n + ") {\n              labels(first: 100) {\n                edges {\n                  node {\n                    name\n                  }\n                }\n              }\n            }";
    })
        .join(',');
    return "\n    query {\n      repository(owner: \"" + repoOwner + "\", name: \"" + repoName + "\") {\n        " + resultList + "\n      }\n    }";
};
exports.commentGitHubIssue = function (headers, issueId, comment) {
    performGitHubGraphqlRequest(headers, {
        query: addGitHubCommentMutation(issueId, comment)
    });
};
exports.commentGitHubPullRequest = function (headers, pullRequestId, comment) {
    performGitHubGraphqlRequest(headers, {
        query: addGitHubCommentMutation(pullRequestId, comment)
    });
};
var addGitHubCommentMutation = function (subjectId, comment) {
    return "\n      mutation {\n        addComment(input: { subjectId: \"" + subjectId + "\", body: \"" + comment + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
exports.closeGitHubIssue = function (headers, owner, repo, issueNumber, issueId) {
    var useGraphql = false;
    if (useGraphql) {
        performGitHubGraphqlRequest(headers, {
            query: closeGitHubIssueMutation(issueId)
        });
    }
    else {
        performGitHubRestRequest(headers, "/repos/" + owner + "/" + repo + "/issues/" + issueNumber, 'PATCH', {
            state: 'closed'
        });
    }
};
var closeGitHubIssueMutation = function (issueId) {
    return "\n      mutation {\n        closeIssue(input: { subjectId: \"" + issueId + "\" }) {\n          subject {\n            id\n          }\n        }\n      }";
};
exports.setLabelsForIssue = function (headers, owner, repo, issueNumber, labels) {
    performGitHubRestRequest(headers, "/repos/" + owner + "/" + repo + "/issues/" + issueNumber, 'PATCH', {
        labels: labels
    });
};
//# sourceMappingURL=github.js.map
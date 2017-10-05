"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../shared/utils");
var functions_1 = require("../shared/functions");
var github_1 = require("../shared/github");
module.exports = function (context) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };
    github_1.getAllGitHubIssuesRecursively(githubApiHeaders, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME, null, function (issues) {
        var exclusiveLabels = ['PR in progress', 'work in progress'];
        var issuesWithoutResponse = issues.filter(function (issue) {
            return detectIfNoResponseFromCommunity(issue, exclusiveLabels);
        });
        if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
            issuesWithoutResponse.forEach(function (issue) {
                github_1.commentGitHubIssue(githubApiHeaders, issue.id, "No response from the community. ping @nmetulev");
            });
        }
        functions_1.completeFunction(context, null, { status: 201, body: issuesWithoutResponse });
    });
};
var detectIfNoResponseFromCommunity = function (issue, exclusiveLabels) {
    var loginsOfAuthors = utils_1.distinct(issue.commentAuthors.edges.map(function (edge) { return edge.node.author.login; }));
    var issueHasNoResponse = utils_1.distinct(loginsOfAuthors.filter(function (c) { return c !== issue.author.login; })).length === 0;
    if (issueHasNoResponse) {
        var containsExclusiveLabels = issue.labels.edges
            .map(function (edge) { return edge.node; })
            .some(function (label) {
            return exclusiveLabels.some(function (l) { return l === label.name; });
        });
        if (!containsExclusiveLabels) {
            var today = new Date();
            if (new Date(issue.createdAt) < utils_1.addDays(today, -7)) {
                return true;
            }
        }
    }
    return false;
};
//# sourceMappingURL=index.js.map
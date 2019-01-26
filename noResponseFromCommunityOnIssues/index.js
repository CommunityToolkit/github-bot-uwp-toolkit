"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../shared/utils");
var functions_1 = require("../shared/functions");
var github_1 = require("../shared/github");
var constants_1 = require("../shared/constants");
module.exports = function (context) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + constants_1.ACCESS_TOKEN
    };
    github_1.getAllGitHubIssuesRecursively(githubApiHeaders, constants_1.TARGET_REPO_OWNER, constants_1.TARGET_REPO_NAME, null, function (issues) {
        var exclusiveLabels = [
            'PR in progress',
            'work in progress',
            'help wanted',
            'uservoice-entry-created',
            'mute-bot'
        ];
        var contributorsToAlert = [
            'nmetulev',
            'Odonno',
            'IbraheemOsama'
        ];
        var issuesWithoutResponse = issues.filter(function (issue) {
            return detectIfNoResponseFromCommunity(issue, exclusiveLabels);
        });
        if (constants_1.ACTIVATE_MUTATION) {
            var pingContributorsMessagePart_1 = contributorsToAlert.map(function (c) { return '@' + c; }).join(' ');
            issuesWithoutResponse.forEach(function (issue) {
                github_1.commentGitHubIssue(githubApiHeaders, issue.id, "No response from the community. ping " + pingContributorsMessagePart_1);
            });
        }
        context.log(issuesWithoutResponse);
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
            if (new Date(issue.createdAt) < utils_1.addDays(today, -constants_1.NUMBER_OF_DAYS_WITHOUT_RESPONSE)) {
                return true;
            }
        }
    }
    return false;
};
//# sourceMappingURL=index.js.map
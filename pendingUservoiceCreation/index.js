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
    github_1.getAllGitHubIssuesRecursivelyFilterWithLabels(githubApiHeaders, constants_1.TARGET_REPO_OWNER, constants_1.TARGET_REPO_NAME, null, ["pending-uservoice-creation"], function (issues) {
        context.log("Total of " + issues.length + " issues pending uservoice creation.");
        context.log(issues);
        var issuesWithoutActivity = issues.filter(function (issue) {
            var lastComment = issue.lastComment.edges[0];
            var today = new Date();
            if (lastComment && new Date(lastComment.node.updatedAt) < utils_1.addDays(today, -constants_1.NUMBER_OF_DAYS_WITHOUT_ACTIVITY)) {
                return true;
            }
            return false;
        });
        if (constants_1.ACTIVATE_MUTATION) {
            issuesWithoutActivity.forEach(function (issue) {
                github_1.commentGitHubIssue(githubApiHeaders, issue.id, 'Seems like there is no uservoice entry created.');
            });
        }
        context.log("Total of " + issuesWithoutActivity.length + " issues pending uservoice creation AND inactive.");
        context.log(issuesWithoutActivity);
        functions_1.completeFunction(context, null, issuesWithoutActivity);
    });
};
//# sourceMappingURL=index.js.map
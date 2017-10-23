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
    github_1.getAllGitHubIssuesRecursivelyFilterWithLabels(githubApiHeaders, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME, null, ["pending-uservoice-creation"], function (issues) {
        context.log("Total of " + issues.length + " issues pending uservoice creation.");
        context.log(issues);
        var issuesWithoutActivity = issues.filter(function (issue) {
            var lastComment = issue.lastComment.edges[0];
            var today = new Date();
            var numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');
            if (lastComment && new Date(lastComment.node.updatedAt) < utils_1.addDays(today, -numberOfDaysWithoutActivity)) {
                return true;
            }
            return false;
        });
        if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
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
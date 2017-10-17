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
        var issuesWithoutActivity = issues.filter(function (issue) {
            var lastComment = issue.lastComment.edges[0];
            var today = new Date();
            var numberOfDaysWithoutActivity = 7;
            if (lastComment && new Date(lastComment.node.updatedAt) < utils_1.addDays(today, -numberOfDaysWithoutActivity)) {
                return true;
            }
            return false;
        });
        issuesWithoutActivity.forEach(function (issue) {
            github_1.commentGitHubIssue(githubApiHeaders, issue.id, 'Seems like there is no uservoice entry created.');
        });
        context.log(issuesWithoutActivity);
        functions_1.completeFunctionBySendingMail(context, [{ "to": [{ "email": "nmetulev@microsoft.com" }] }], { email: "sender@contoso.com" }, "Pending Uservoice Creation", [{
                type: 'text/plain',
                value: JSON.stringify(issuesWithoutActivity)
            }]);
    });
};
//# sourceMappingURL=index.js.map
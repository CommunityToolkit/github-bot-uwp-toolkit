"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var github_1 = require("../shared/github");
var functions_1 = require("../shared/functions");
var utils_1 = require("../shared/utils");
module.exports = function (context) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };
    github_1.getAllMilestones(githubApiHeaders, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME, function (milestones) {
        var currentMilestone = milestones
            .filter(function (m) { return m.state === 'OPEN' && !!m.dueOn; })
            .sort(function (m1, m2) { return new Date(m1.dueOn).getTime() - new Date(m2.dueOn).getTime(); })[0];
        github_1.getAllOpenPullRequests(githubApiHeaders, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER, process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME, function (pullRequests) {
            var exclusiveLabels = [
                'help wanted',
                'mute-bot'
            ];
            var pullRequestsToCheck = pullRequests
                .filter(function (issue) {
                return (!issue.milestone || issue.milestone.number == currentMilestone.number || issue.milestone.state === 'CLOSED');
            })
                .filter(function (issue) {
                return !functions_1.containsExclusiveLabels(issue, exclusiveLabels);
            });
            var numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');
            var inactivePullRequests = pullRequestsToCheck.filter(function (pr) {
                return detectPullRequestWithoutActivity(pr, numberOfDaysWithoutActivity * 2);
            });
            var decisions = makeDecisions(githubApiHeaders, inactivePullRequests);
            context.log(decisions);
            functions_1.completeFunction(context, null, { status: 201, body: decisions });
        });
    });
};
var detectPullRequestWithoutActivity = function (issue, numberOfDaysWithoutActivity) {
    var lastComment = issue.lastComment.edges[0];
    var today = new Date();
    if (lastComment && new Date(lastComment.node.updatedAt) < utils_1.addDays(today, -numberOfDaysWithoutActivity)) {
        return true;
    }
    return false;
};
var makeDecisions = function (githubApiHeaders, pullRequests) {
    var decisions = pullRequests.map(function (pr) {
        return {
            pullRequest: pr,
            numberOfAlertsAlreadySent: null,
            decision: 'alert'
        };
    });
    if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
        decisions.forEach(function (d) {
            github_1.commentGitHubPullRequest(githubApiHeaders, d.pullRequest.id, "This PR seems inactive. @" + d.pullRequest.author.login + " Do you need help to complete this issue?");
        });
    }
    return decisions;
};
//# sourceMappingURL=index.js.map
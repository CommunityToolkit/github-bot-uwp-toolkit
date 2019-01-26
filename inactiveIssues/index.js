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
    github_1.getAllMilestones(githubApiHeaders, constants_1.REPO_OWNER, constants_1.REPO_NAME, function (milestones) {
        var currentMilestone = milestones
            .filter(function (m) { return m.state === 'OPEN' && !!m.dueOn; })
            .sort(function (m1, m2) { return new Date(m1.dueOn).getTime() - new Date(m2.dueOn).getTime(); })[0];
        github_1.getAllGitHubIssuesRecursively(githubApiHeaders, constants_1.REPO_OWNER, constants_1.REPO_NAME, null, function (issues) {
            var exclusiveLabels = [
                'PR in progress',
                'work in progress',
                'help wanted',
                'uservoice-entry-created',
                'mute-bot'
            ];
            var issuesToCheck = issues
                .filter(function (issue) {
                return (!issue.milestone || issue.milestone.number == currentMilestone.number || issue.milestone.state === 'CLOSED');
            })
                .filter(function (issue) {
                return !functions_1.containsExclusiveLabels(issue, exclusiveLabels);
            });
            var issuesInTheCurrentMilestone = issuesToCheck
                .filter(function (issue) { return issue.milestone && issue.milestone.number === currentMilestone.number; });
            var issuesNotInMilestone = issuesToCheck
                .filter(function (issue) { return !issue.milestone || issue.milestone.state === 'CLOSED'; });
            var inactiveIssuesInTheCurrentMilestone = issuesInTheCurrentMilestone.filter(function (issue) {
                return detectIssueWithoutActivity(issue, constants_1.NUMBER_OF_DAYS_WITHOUT_ACTIVITY * 2);
            });
            var inactiveIssuesNotInMilestone = issuesNotInMilestone.filter(function (issue) {
                return detectIssueWithoutActivity(issue, constants_1.NUMBER_OF_DAYS_WITHOUT_ACTIVITY);
            });
            var decisions1 = makeDecisionsForIssuesInCurrentMilestone(githubApiHeaders, inactiveIssuesInTheCurrentMilestone);
            var decisions2 = makeDecisionsForIssuesNotInMilestone(githubApiHeaders, inactiveIssuesNotInMilestone);
            var decisions = decisions1.concat(decisions2);
            context.log(decisions);
            functions_1.completeFunction(context, null, { status: 201, body: decisions });
        });
    });
};
var detectNumberOfAlertsAlreadySent = function (botUsername, issue) {
    var lastTwoMessages = issue.lastTwoComments.edges.map(function (edge) { return edge.node; });
    var numberOfAlertsAlreadySent = 0;
    for (var i = lastTwoMessages.length - 1; i >= 0; i--) {
        var message = lastTwoMessages[i];
        if (message.author.login === botUsername && message.body.indexOf('This issue seems inactive') > -1) {
            numberOfAlertsAlreadySent++;
        }
        else {
            break;
        }
    }
    return numberOfAlertsAlreadySent;
};
var detectIssueWithoutActivity = function (issue, numberOfDaysWithoutActivity) {
    var loginsOfAuthors = utils_1.distinct(issue.commentAuthors.edges.map(function (edge) { return edge.node.author.login; }));
    var issueHasResponse = utils_1.distinct(loginsOfAuthors.filter(function (c) { return c !== issue.author.login; })).length > 0;
    if (issueHasResponse) {
        var lastComment = issue.lastComment.edges[0];
        var today = new Date();
        if (lastComment && new Date(lastComment.node.updatedAt) < utils_1.addDays(today, -numberOfDaysWithoutActivity)) {
            return true;
        }
    }
    return false;
};
var makeDecisionsForIssuesInCurrentMilestone = function (githubApiHeaders, issues) {
    var decisions = issues.map(function (issue) {
        return {
            issue: issue,
            numberOfAlertsAlreadySent: null,
            decision: 'alert',
            inCurrentMilestone: true
        };
    });
    if (constants_1.ACTIVATE_MUTATION) {
        decisions.forEach(function (d) {
            github_1.commentGitHubIssue(githubApiHeaders, d.issue.id, "This issue seems inactive. Do you need help to complete this issue?");
        });
    }
    return decisions;
};
var makeDecisionsForIssuesNotInMilestone = function (githubApiHeaders, issues) {
    var decisions = issues.map(function (issue) {
        var numberOfAlertsAlreadySent = detectNumberOfAlertsAlreadySent(constants_1.BOT_USERNAME, issue);
        if (numberOfAlertsAlreadySent === 2) {
            return {
                issue: issue,
                numberOfAlertsAlreadySent: numberOfAlertsAlreadySent,
                decision: 'close',
                inCurrentMilestone: false
            };
        }
        else {
            return {
                issue: issue,
                numberOfAlertsAlreadySent: numberOfAlertsAlreadySent,
                decision: 'alert',
                inCurrentMilestone: false
            };
        }
    });
    if (constants_1.ACTIVATE_MUTATION) {
        decisions.filter(function (d) { return d.decision === 'alert'; }).forEach(function (d) {
            var daysBeforeClosingIssue = constants_1.NUMBER_OF_DAYS_WITHOUT_ACTIVITY * (2 - d.numberOfAlertsAlreadySent);
            github_1.commentGitHubIssue(githubApiHeaders, d.issue.id, "This issue seems inactive. It will automatically be closed in " + daysBeforeClosingIssue + " days if there is no activity.");
        });
        decisions.filter(function (d) { return d.decision === 'close'; }).forEach(function (d) {
            github_1.commentGitHubIssue(githubApiHeaders, d.issue.id, 'Issue is inactive. It was automatically closed.');
            github_1.closeGitHubIssue(githubApiHeaders, constants_1.REPO_OWNER, constants_1.REPO_NAME, d.issue.number, d.issue.id);
        });
    }
    return decisions;
};
//# sourceMappingURL=index.js.map
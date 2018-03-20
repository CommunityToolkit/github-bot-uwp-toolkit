"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var github_1 = require("../shared/github");
var functions_1 = require("../shared/functions");
var utils_1 = require("../shared/utils");
var firstBlockTitle = '## PR Type';
var labelPRinProgress = 'PR in progress';
module.exports = function (context, req) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };
    var repoOwner = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER;
    var repoName = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME;
    var pullRequestNumber = req.number;
    github_1.getPullRequest(githubApiHeaders, repoOwner, repoName, pullRequestNumber, function (pullRequest) {
        var creationMessage = pullRequest.body;
        var firstBlockOfCreationMessage = creationMessage.split(firstBlockTitle)[0];
        if (firstBlockOfCreationMessage) {
            var linkedItemsNumbers = utils_1.distinct(functions_1.searchLinkedItemsNumbersInComment(firstBlockOfCreationMessage));
            github_1.getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, linkedItemsNumbers, function (results) {
                var issuesNumber = results
                    .filter(function (r) { return r.__typename === 'Issue'; })
                    .map(function (r) { return r.__typename === 'Issue' ? r.number : null; })
                    .filter(function (n) { return !!n; });
                if (issuesNumber.length <= 0) {
                    context.log('linked items are not issues');
                    functions_1.completeFunction(context, req, { status: 201, body: { success: false, message: 'Linked items are not issues.' } });
                    return;
                }
                if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                    github_1.getIssuesLabels(githubApiHeaders, repoOwner, repoName, issuesNumber, function (issuesWithLabels) {
                        if (req.action === 'closed') {
                            var issuesWithLabelsWithExpectedLabel = issuesWithLabels.filter(function (iwl) { return iwl.labels.some(function (label) { return label === labelPRinProgress; }); });
                            issuesWithLabelsWithExpectedLabel.map(function (issueWithLabels) {
                                var labels = utils_1.distinct(issueWithLabels.labels.filter(function (label) { return label !== labelPRinProgress; }));
                                github_1.setLabelsForIssue(githubApiHeaders, repoOwner, repoName, issueWithLabels.number, labels);
                            });
                        }
                        if (req.action === 'opened' || req.action === 'reopened') {
                            var issuesWithLabelsWithoutExpectedLabel = issuesWithLabels.filter(function (iwl) { return iwl.labels.every(function (label) { return label !== labelPRinProgress; }); });
                            issuesWithLabelsWithoutExpectedLabel.map(function (issueWithLabels) {
                                var labels = utils_1.distinct(issueWithLabels.labels.concat([labelPRinProgress]));
                                github_1.setLabelsForIssue(githubApiHeaders, repoOwner, repoName, issueWithLabels.number, labels);
                            });
                        }
                    });
                }
                context.log(issuesNumber);
                functions_1.completeFunction(context, req, { status: 201, body: { success: true, message: issuesNumber } });
            });
        }
        else {
            context.log('no linked issues');
            functions_1.completeFunction(context, req, { status: 201, body: { success: false, message: 'No linked issues.' } });
        }
    });
};
//# sourceMappingURL=index.js.map
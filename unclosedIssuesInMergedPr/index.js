"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../shared/utils");
var functions_1 = require("../shared/functions");
var github_1 = require("../shared/github");
module.exports = function (context, req) {
    if (req.action !== 'closed' || !req.pull_request.merged) {
        context.log('Only watch merged PR.');
        functions_1.completeFunction(context, null, { status: 201, body: { success: false, message: 'Only watch merged PR.' } });
        return;
    }
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };
    var repoOwner = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER;
    var repoName = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME;
    var pullRequestNumber = req.number;
    github_1.getPullRequest(githubApiHeaders, repoOwner, repoName, pullRequestNumber, function (pullRequest) {
        var linkedItemsNumbers = getLinkedItemsNumbersInPullRequest(process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME, pullRequest);
        github_1.getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, linkedItemsNumbers, function (results) {
            var unclosedIssuesNumber = results
                .filter(function (r) { return r.__typename === 'Issue' && r.closed === false; })
                .map(function (r) { return r.__typename === 'Issue' ? r.number : null; })
                .filter(function (n) { return !!n; });
            if (unclosedIssuesNumber.length <= 0) {
                context.log('No linked issue detected.');
                functions_1.completeFunctionBySendingMail(context, [{ "to": [{ "email": "nmetulev@microsoft.com" }] }], { email: "sender@contoso.com" }, "#" + pullRequestNumber + " PR merged - no linked issue", [{
                        type: 'text/plain',
                        value: 'No unclosed issue linked to this merged PR.'
                    }]);
                return;
            }
            var linkedItemsMessagePart = unclosedIssuesNumber
                .sort(function (a, b) { return a - b; })
                .map(function (n) { return '#' + n; })
                .join(', ');
            if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                github_1.commentGitHubIssue(githubApiHeaders, pullRequest.id, "This PR is linked to unclosed issues. Please check if one of these issues should be closed: " + linkedItemsMessagePart);
            }
            context.log(unclosedIssuesNumber);
            functions_1.completeFunctionBySendingMail(context, [{ "to": [{ "email": "nmetulev@microsoft.com" }] }], { email: "sender@contoso.com" }, "#" + pullRequestNumber + " PR merged - found linked issues", [{
                    type: 'text/plain',
                    value: "This PR is linked to unclosed issues. Please check if one of these issues should be closed: " + linkedItemsMessagePart
                }]);
        });
    });
};
var getLinkedItemsNumbersInPullRequest = function (botUsername, pullRequest) {
    var hasAlreadyGotTheMessage = pullRequest.comments.edges.map(function (edge) { return edge.node; }).filter(function (c) {
        return (c.author.login === botUsername && c.body.indexOf('This PR is linked to unclosed issues.') > -1);
    }).length > 0;
    if (!hasAlreadyGotTheMessage) {
        var linkedItemsNumbersInComments = pullRequest.comments.edges.map(function (edge) { return edge.node; })
            .map(function (c) { return searchLinkedItemsNumbersInComment(c.body); })
            .reduce(function (a, b) { return a.concat(b); }, []);
        var linkedItemsNubmersInBodyMessage = searchLinkedItemsNumbersInComment(pullRequest.body);
        var linkedItemsNumbers = linkedItemsNumbersInComments.concat(linkedItemsNubmersInBodyMessage);
        var distinctLinkedItemsNumbers = utils_1.distinct(linkedItemsNumbers);
        return distinctLinkedItemsNumbers;
    }
    return [];
};
var searchLinkedItemsNumbersInComment = function (message) {
    var matches = message.match(/[#][0-9]+/g);
    if (matches) {
        return matches.map(function (m) { return parseInt(m.trim().substr(1)); });
    }
    return [];
};
//# sourceMappingURL=index.js.map
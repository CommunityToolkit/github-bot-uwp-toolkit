"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../shared/utils");
var github_1 = require("../shared/github");
module.exports = function (context, pullRequestId) {
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };
    var repoOwner = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER;
    var repoName = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME;
    github_1.getPullRequest(githubApiHeaders, repoOwner, repoName, pullRequestId, function (pullRequest) {
        var linkedItemsNumbers = getLinkedItemsNumbersInPullRequest(process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME, pullRequest);
        github_1.getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, linkedItemsNumbers, function (results) {
            var unclosedIssuesNumber = results
                .filter(function (r) { return r.__typename === 'Issue' && r.closed === false; })
                .map(function (r) { return r.__typename === 'Issue' ? r.number : null; })
                .filter(function (n) { return !!n; });
            if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                var linkedItemsMessagePart = unclosedIssuesNumber.map(function (n) { return '#' + n; }).join(', ');
                github_1.commentGitHubIssue(githubApiHeaders, pullRequest.id, "This PR is linked to unclosed issues. Please check if one of these issues should be closed: " + linkedItemsMessagePart);
            }
            context.done(null, unclosedIssuesNumber);
        });
    });
};
var getLinkedItemsNumbersInPullRequest = function (botUsername, pullRequest) {
    var hasAlreadyGotTheMessage = pullRequest.comments.edges.map(function (edge) { return edge.node; }).filter(function (c) {
        return (c.author.login === botUsername && c.body.indexOf('This PR is linked to unclosed issues.') > -1);
    }).length > 0;
    if (!hasAlreadyGotTheMessage) {
        var linkedItemsNumbers = pullRequest.comments.edges.map(function (edge) { return edge.node; })
            .map(function (c) { return searchLinkedItemsNumbersInComment(c.body); })
            .reduce(function (a, b) { return a.concat(b); }, []);
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../shared/utils");
var functions_1 = require("../shared/functions");
var github_1 = require("../shared/github");
var constants_1 = require("../shared/constants");
module.exports = function (context, req) {
    if (req.action !== 'closed' || !req.pull_request.merged) {
        context.log('Only watch merged PR.');
        functions_1.completeFunction(context, null, { status: 201, body: { success: false, message: 'Only watch merged PR.' } });
        return;
    }
    var githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + constants_1.ACCESS_TOKEN
    };
    var pullRequestNumber = req.number;
    github_1.getPullRequest(githubApiHeaders, constants_1.REPO_OWNER, constants_1.REPO_NAME, pullRequestNumber, function (pullRequest) {
        var linkedItemsNumbers = getLinkedItemsNumbersInPullRequest(constants_1.BOT_USERNAME, pullRequest);
        github_1.getIssueOrPullRequestLinks(githubApiHeaders, constants_1.REPO_OWNER, constants_1.REPO_NAME, linkedItemsNumbers, function (results) {
            var unclosedIssuesNumber = results
                .filter(function (r) { return r.__typename === 'Issue' && r.closed === false; })
                .map(function (r) { return r.__typename === 'Issue' ? r.number : null; })
                .filter(function (n) { return !!n; });
            if (unclosedIssuesNumber.length <= 0) {
                context.log('No linked issue detected.');
                functions_1.completeFunction(context, null, { status: 201, body: { success: false, message: 'No unclosed issue linked to this merged PR.' } });
                return;
            }
            var linkedItemsMessagePart = unclosedIssuesNumber
                .sort(function (a, b) { return a - b; })
                .map(function (n) { return '#' + n; })
                .join(', ');
            if (constants_1.ACTIVATE_MUTATION) {
                github_1.commentGitHubIssue(githubApiHeaders, pullRequest.id, "This PR is linked to unclosed issues. Please check if one of these issues should be closed: " + linkedItemsMessagePart);
            }
            context.log(unclosedIssuesNumber);
            functions_1.completeFunction(context, req, { status: 201, body: { success: true, message: unclosedIssuesNumber } });
        });
    });
};
var getLinkedItemsNumbersInPullRequest = function (botUsername, pullRequest) {
    var hasAlreadyGotTheMessage = pullRequest.comments.edges.map(function (edge) { return edge.node; }).filter(function (c) {
        return (c.author.login === botUsername && c.body.indexOf('This PR is linked to unclosed issues.') > -1);
    }).length > 0;
    if (!hasAlreadyGotTheMessage) {
        var linkedItemsNumbersInComments = pullRequest.comments.edges.map(function (edge) { return edge.node; })
            .map(function (c) { return functions_1.searchLinkedItemsNumbersInComment(c.body); })
            .reduce(function (a, b) { return a.concat(b); }, []);
        var linkedItemsNubmersInBodyMessage = functions_1.searchLinkedItemsNumbersInComment(pullRequest.body);
        var linkedItemsNumbers = linkedItemsNumbersInComments.concat(linkedItemsNubmersInBodyMessage);
        var distinctLinkedItemsNumbers = utils_1.distinct(linkedItemsNumbers);
        return distinctLinkedItemsNumbers;
    }
    return [];
};
//# sourceMappingURL=index.js.map
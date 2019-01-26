import { distinct } from '../shared/utils';
import { completeFunction, searchLinkedItemsNumbersInComment } from '../shared/functions';
import { PullRequestNode } from '../shared/models';
import { getPullRequest, getIssueOrPullRequestLinks, commentGitHubIssue } from '../shared/github';
import { ACCESS_TOKEN, TARGET_REPO_OWNER, TARGET_REPO_NAME, BOT_LOGIN, ACTIVATE_MUTATION } from '../shared/constants';

module.exports = (context, req) => {
    if (req.action !== 'closed' || !req.pull_request.merged) {
        context.log('Only watch merged PR.');
        completeFunction(context, null, { status: 201, body: { success: false, message: 'Only watch merged PR.' } })
        return;
    }

    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + ACCESS_TOKEN
    };

    const pullRequestNumber: number = req.number;

    getPullRequest(
        githubApiHeaders,
        TARGET_REPO_OWNER,
        TARGET_REPO_NAME,
        pullRequestNumber,
        (pullRequest) => {
            // get linked items (can be issue or PR)
            const linkedItemsNumbers = getLinkedItemsNumbersInPullRequest(
                BOT_LOGIN,
                pullRequest
            );

            getIssueOrPullRequestLinks(githubApiHeaders, TARGET_REPO_OWNER, TARGET_REPO_NAME, linkedItemsNumbers, (results) => {
                const unclosedIssuesNumber = results
                    .filter(r => r.__typename === 'Issue' && r.closed === false)
                    .map(r => r.__typename === 'Issue' ? r.number : null)
                    .filter(n => !!n);

                if (unclosedIssuesNumber.length <= 0) {
                    context.log('No linked issue detected.');
                    completeFunction(context, null, { status: 201, body: { success: false, message: 'No unclosed issue linked to this merged PR.' } });
                    return;
                }

                const linkedItemsMessagePart = unclosedIssuesNumber
                    .sort((a, b) => a - b)
                    .map(n => '#' + n)
                    .join(', ');

                if (ACTIVATE_MUTATION) {
                    // send a message with links to unclosed issues
                    commentGitHubIssue(
                        githubApiHeaders,
                        pullRequest.id,
                        `This PR is linked to unclosed issues. Please check if one of these issues should be closed: ${linkedItemsMessagePart}`);
                }

                context.log(unclosedIssuesNumber);
                completeFunction(context, req, { status: 201, body: { success: true, message: unclosedIssuesNumber } });
            });
        });
}

const getLinkedItemsNumbersInPullRequest = (botUsername: string, pullRequest: PullRequestNode): number[] => {
    // do not send a new message if one has already been added
    const hasAlreadyGotTheMessage = pullRequest.comments.edges.map(edge => edge.node).filter(c => {
        return (c.author.login === botUsername && c.body.indexOf('This PR is linked to unclosed issues.') > -1);
    }).length > 0;

    if (!hasAlreadyGotTheMessage) {
        // check if there are linked items (issues/prs) to the PR (analyze text of PR comments)
        const linkedItemsNumbersInComments = pullRequest.comments.edges.map(edge => edge.node)
            .map(c => searchLinkedItemsNumbersInComment(c.body))
            .reduce((a, b) => a.concat(b), []);

        const linkedItemsNubmersInBodyMessage = searchLinkedItemsNumbersInComment(pullRequest.body);

        const linkedItemsNumbers = linkedItemsNumbersInComments.concat(linkedItemsNubmersInBodyMessage);
        const distinctLinkedItemsNumbers = distinct(linkedItemsNumbers);

        return distinctLinkedItemsNumbers;
    }

    return [];
}
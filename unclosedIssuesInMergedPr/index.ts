import { distinct } from '../shared/utils';
import { PullRequestNode } from '../shared/models';
import { getPullRequest, getIssueOrPullRequestLinks, commentGitHubIssue } from '../shared/github';

module.exports = (context, pullRequestId: number) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };

    const repoOwner = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER;
    const repoName = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME;

    getPullRequest(
        githubApiHeaders,
        repoOwner,
        repoName,
        pullRequestId,
        (pullRequest) => {
            // get linked items (can be issue or PR)
            const linkedItemsNumbers = getLinkedItemsNumbersInPullRequest(
                process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME, 
                pullRequest);

            getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, linkedItemsNumbers, (results) => {
                const unclosedIssuesNumber = results
                    .filter(r => r.__typename === 'Issue' && r.closed === false)
                    .map(r => r.__typename === 'Issue' ? r.number : null)
                    .filter(n => !!n);

                // send a message with links to unclosed issues
                const linkedItemsMessagePart = unclosedIssuesNumber.map(n => '#' + n).join(', ');
                commentGitHubIssue(
                    githubApiHeaders,
                    pullRequest.id,
                    `This PR is linked to unclosed issues. Please check if one of these issues should be closed: ${linkedItemsMessagePart}`);

                context.done(null, unclosedIssuesNumber);
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
        const linkedItemsNumbers = pullRequest.comments.edges.map(edge => edge.node)
            .map(c => searchLinkedItemsNumbersInComment(c.body))
            .reduce((a, b) => a.concat(b), []);
        const distinctLinkedItemsNumbers = distinct(linkedItemsNumbers);

        return distinctLinkedItemsNumbers;
    }

    return [];
}

const searchLinkedItemsNumbersInComment = (message: string): number[] => {
    const matches = message.match(/[#][0-9]+/g);

    if (matches) {
        return matches.map(m => parseInt(m.trim().substr(1)));
    }
    return [];
}
import { addDays, distinct } from '../shared/utils';
import { completeFunction } from '../shared/functions';
import { IssueNode } from '../shared/models';
import { getAllGitHubIssuesRecursively, commentGitHubIssue } from '../shared/github';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };

    getAllGitHubIssuesRecursively(
        githubApiHeaders,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
        null,
        (issues) => {
            const exclusiveLabels = ['PR in progress', 'work in progress'];

            // check issues that match the filter
            const issuesWithoutResponse = issues.filter(issue => {
                return detectIfNoResponseFromCommunity(issue, exclusiveLabels);
            });

            if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                // send a message with a ping to the team
                issuesWithoutResponse.forEach(issue => {
                    commentGitHubIssue(githubApiHeaders, issue.id, `No response from the community. ping @nmetulev`);
                });
            }

            completeFunction(context, null, { status: 201, body: issuesWithoutResponse });
        });
};

const detectIfNoResponseFromCommunity = (issue: IssueNode, exclusiveLabels: string[]): boolean => {
    // check if there is only one user who write a message (the creator of the message)
    const loginsOfAuthors: string[] = distinct(issue.commentAuthors.edges.map(edge => edge.node.author.login));
    const issueHasNoResponse = distinct(loginsOfAuthors.filter(c => c !== issue.author.login)).length === 0;

    if (issueHasNoResponse) {
        // check if the issue contains an exclusive labels (only issues without those labels are usable)
        const containsExclusiveLabels = issue.labels.edges
            .map(edge => edge.node)
            .some(label => {
                return exclusiveLabels.some(l => l === label.name);
            });

        if (!containsExclusiveLabels) {
            // check if the issue was created 7 days ago
            const today = new Date();

            if (new Date(issue.createdAt) < addDays(today, -7)) {
                return true;
            }
        }
    }

    return false;
}
import { addDays, distinct } from '../shared/utils';
import { completeFunction } from '../shared/functions';
import { IssueNode } from '../shared/models';
import { getAllGitHubIssuesRecursively, commentGitHubIssue } from '../shared/github';
import { NUMBER_OF_DAYS_WITHOUT_RESPONSE, ACCESS_TOKEN, REPO_OWNER, REPO_NAME, ACTIVATE_MUTATION } from '../shared/constants';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + ACCESS_TOKEN
    };

    getAllGitHubIssuesRecursively(
        githubApiHeaders,
        REPO_OWNER,
        REPO_NAME,
        null,
        (issues) => {
            const exclusiveLabels = [
                'PR in progress', 
                'work in progress',
                'help wanted',
                'uservoice-entry-created',
                'mute-bot'
            ];
            const contributorsToAlert = [
                'nmetulev',
                'Odonno',
                'IbraheemOsama'
            ];

            // check issues that match the filter
            const issuesWithoutResponse = issues.filter(issue => {
                return detectIfNoResponseFromCommunity(issue, exclusiveLabels);
            });

            if (ACTIVATE_MUTATION) {
                const pingContributorsMessagePart = contributorsToAlert.map(c => '@' + c).join(' ');

                // send a message with a ping to the team
                issuesWithoutResponse.forEach(issue => {
                    commentGitHubIssue(githubApiHeaders, issue.id, `No response from the community. ping ${pingContributorsMessagePart}`);
                });
            }

            context.log(issuesWithoutResponse);
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
            // check if the issue was created x days ago
            const today = new Date();

            if (new Date(issue.createdAt) < addDays(today, -NUMBER_OF_DAYS_WITHOUT_RESPONSE)) {
                return true;
            }
        }
    }

    return false;
}
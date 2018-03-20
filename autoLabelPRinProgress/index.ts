import { getPullRequest, getIssueOrPullRequestLinks, setLabelsForIssue, getIssuesLabels } from '../shared/github';
import { searchLinkedItemsNumbersInComment, completeFunction } from '../shared/functions';
import { distinct } from '../shared/utils';

const firstBlockTitle = '## PR Type';
const labelPRinProgress = 'PR in progress';

module.exports = (context, req) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };

    const repoOwner = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER;
    const repoName = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME;
    const pullRequestNumber: number = req.number;

    getPullRequest(
        githubApiHeaders,
        repoOwner,
        repoName,
        pullRequestNumber,
        (pullRequest) => {
            // retrieve first block of creation block where user puts the linked issues
            const creationMessage = pullRequest.body;
            const firstBlockOfCreationMessage = creationMessage.split(firstBlockTitle)[0];

            if (firstBlockOfCreationMessage) {
                const linkedItemsNumbers = distinct(searchLinkedItemsNumbersInComment(firstBlockOfCreationMessage));

                getIssueOrPullRequestLinks(githubApiHeaders, repoOwner, repoName, linkedItemsNumbers, (results) => {
                    const issuesNumber = results
                        .filter(r => r.__typename === 'Issue')
                        .map(r => r.__typename === 'Issue' ? r.number : null)
                        .filter(n => !!n);

                    if (issuesNumber.length <= 0) {
                        context.log('linked items are not issues');
                        completeFunction(context, req, { status: 201, body: { success: false, message: 'Linked items are not issues.' } });
                        return;
                    }

                    if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                        getIssuesLabels(githubApiHeaders, repoOwner, repoName, issuesNumber, (issuesWithLabels) => {
                            if (req.action === 'closed') {
                                // filter issues which DOES already contain the label
                                const issuesWithLabelsWithExpectedLabel =
                                    issuesWithLabels.filter(iwl => iwl.labels.some(label => label === labelPRinProgress));

                                // remove label 'PR in progress'
                                issuesWithLabelsWithExpectedLabel.map(issueWithLabels => {
                                    const labels = distinct(issueWithLabels.labels.filter(label => label !== labelPRinProgress));
                                    setLabelsForIssue(githubApiHeaders, repoOwner, repoName, issueWithLabels.number, labels);
                                });
                            }
                            if (req.action === 'opened' || req.action === 'reopened') {
                                // filter issues which does NOT already contain the label
                                const issuesWithLabelsWithoutExpectedLabel =
                                    issuesWithLabels.filter(iwl => iwl.labels.every(label => label !== labelPRinProgress));

                                // add label 'PR in progress'
                                issuesWithLabelsWithoutExpectedLabel.map(issueWithLabels => {
                                    const labels = distinct(issueWithLabels.labels.concat([labelPRinProgress]));
                                    setLabelsForIssue(githubApiHeaders, repoOwner, repoName, issueWithLabels.number, labels);
                                });
                            }
                        })
                    }

                    context.log(issuesNumber);
                    completeFunction(context, req, { status: 201, body: { success: true, message: issuesNumber } });
                });
            } else {
                context.log('no linked issues');
                completeFunction(context, req, { status: 201, body: { success: false, message: 'No linked issues.' } });
            }
        });
};
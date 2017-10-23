import { addDays } from '../shared/utils';
import { completeFunction } from '../shared/functions';
import { getAllGitHubIssuesRecursivelyFilterWithLabels, commentGitHubIssue } from '../shared/github';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };

    getAllGitHubIssuesRecursivelyFilterWithLabels(
        githubApiHeaders,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
        null,
        ["pending-uservoice-creation"],
        (issues) => {
            context.log(`Total of ${issues.length} issues pending uservoice creation.`);
            context.log(issues);

            const issuesWithoutActivity = issues.filter(issue => {
                // check if last message was sent x days ago
                const lastComment = issue.lastComment.edges[0];
                const today = new Date();
                const numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');

                if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -numberOfDaysWithoutActivity)) {
                    return true;
                }
                return false;
            });

            if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
                // send a comment to create the uservoice entry
                issuesWithoutActivity.forEach(issue => {
                    commentGitHubIssue(githubApiHeaders, issue.id, 'Seems like there is no uservoice entry created.');
                });
            }

            context.log(`Total of ${issuesWithoutActivity.length} issues pending uservoice creation AND inactive.`);
            context.log(issuesWithoutActivity);
            completeFunction(context, null, issuesWithoutActivity);
        });
};
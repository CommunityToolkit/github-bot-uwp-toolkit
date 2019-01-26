import { addDays } from '../shared/utils';
import { completeFunction } from '../shared/functions';
import { getAllGitHubIssuesRecursivelyFilterWithLabels, commentGitHubIssue } from '../shared/github';
import { NUMBER_OF_DAYS_WITHOUT_ACTIVITY, ACCESS_TOKEN, REPO_OWNER, REPO_NAME, ACTIVATE_MUTATION } from '../shared/constants';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + ACCESS_TOKEN
    };

    getAllGitHubIssuesRecursivelyFilterWithLabels(
        githubApiHeaders,
        REPO_OWNER,
        REPO_NAME,
        null,
        ["pending-uservoice-creation"],
        (issues) => {
            context.log(`Total of ${issues.length} issues pending uservoice creation.`);
            context.log(issues);

            const issuesWithoutActivity = issues.filter(issue => {
                // check if last message was sent x days ago
                const lastComment = issue.lastComment.edges[0];
                const today = new Date();

                if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -NUMBER_OF_DAYS_WITHOUT_ACTIVITY)) {
                    return true;
                }
                return false;
            });

            if (ACTIVATE_MUTATION) {
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
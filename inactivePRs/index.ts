import { getAllMilestones, getAllOpenPullRequests, commentGitHubPullRequest } from '../shared/github';
import { containsExclusiveLabels, completeFunction } from '../shared/functions';
import { PullRequest } from '../shared/models';
import { addDays } from '../shared/utils';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN
    };

    getAllMilestones(
        githubApiHeaders,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
        process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
        (milestones) => {
            const currentMilestone = milestones
                .filter(m => m.state === 'OPEN' && !!m.dueOn)
                .sort((m1, m2) => new Date(m1.dueOn).getTime() - new Date(m2.dueOn).getTime())
            [0];

            getAllOpenPullRequests(
                githubApiHeaders,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
                (pullRequests) => {
                    const exclusiveLabels = [
                        'help wanted',
                        'mute-bot'
                    ];

                    // only check PRs in the current milestone or not in a milestone (or a previous milestone)
                    // only check PRs without exlusive labels
                    const pullRequestsToCheck = pullRequests
                        .filter(issue => {
                            return (!issue.milestone || issue.milestone.number == currentMilestone.number || issue.milestone.state === 'CLOSED');
                        })
                        .filter(issue => {
                            return !containsExclusiveLabels(issue, exclusiveLabels);
                        });

                    const numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');

                    const inactivePullRequests = pullRequestsToCheck.filter(pr => {
                        return detectPullRequestWithoutActivity(pr, numberOfDaysWithoutActivity * 2);
                    });

                    const decisions = makeDecisions(githubApiHeaders, inactivePullRequests);

                    context.log(decisions);
                    completeFunction(context, null, { status: 201, body: decisions });
                }
            )
        });
};

type PullRequestActivityDecision = {
    pullRequest: PullRequest;
    numberOfAlertsAlreadySent: number;
    decision: 'alert';
}

const detectPullRequestWithoutActivity = (issue: PullRequest, numberOfDaysWithoutActivity: number): boolean => {
    // check if last message was sent x days ago
    const lastComment = issue.lastComment.edges[0];
    const today = new Date();

    if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -numberOfDaysWithoutActivity)) {
        return true;
    }

    return false;
}

const makeDecisions = (githubApiHeaders: any, pullRequests: PullRequest[]): PullRequestActivityDecision[] => {
    const decisions = pullRequests.map<PullRequestActivityDecision>(pr => {
        return {
            pullRequest: pr,
            numberOfAlertsAlreadySent: null,
            decision: 'alert'
        };
    });

    if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
        decisions.forEach(d => {
            commentGitHubPullRequest(
                githubApiHeaders,
                d.pullRequest.id,
                `This PR seems inactive. @${d.pullRequest.author.login} Do you need help to complete this issue?`);
        });
    }

    return decisions;
}
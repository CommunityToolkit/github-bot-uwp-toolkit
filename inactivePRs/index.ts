import { getAllMilestones, getAllOpenPullRequests, commentGitHubPullRequest } from '../shared/github';
import { containsExclusiveLabels, completeFunction } from '../shared/functions';
import { PullRequest } from '../shared/models';
import { addDays } from '../shared/utils';
import { NUMBER_OF_DAYS_WITHOUT_ACTIVITY, ACCESS_TOKEN, TARGET_REPO_OWNER, TARGET_REPO_NAME, ACTIVATE_MUTATION } from '../shared/constants';

module.exports = (context) => {
    const githubApiHeaders = {
        'User-Agent': 'github-bot-uwp-toolkit',
        'Authorization': 'token ' + ACCESS_TOKEN
    };

    getAllMilestones(
        githubApiHeaders,
        TARGET_REPO_OWNER,
        TARGET_REPO_NAME,
        (milestones) => {
            const currentMilestone = milestones
                .filter(m => m.state === 'OPEN' && !!m.dueOn)
                .sort((m1, m2) => new Date(m1.dueOn).getTime() - new Date(m2.dueOn).getTime())
            [0];

            getAllOpenPullRequests(
                githubApiHeaders,
                TARGET_REPO_OWNER,
                TARGET_REPO_NAME,
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

                    const inactivePullRequests = pullRequestsToCheck.filter(pr => {
                        return detectPullRequestWithoutActivity(pr, NUMBER_OF_DAYS_WITHOUT_ACTIVITY * 2);
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

const detectPullRequestWithoutActivity = (pullRequest: PullRequest, numberOfDaysWithoutActivity: number): boolean => {
    // select last edited date (on last message sent or review comments)
    const lastComment = pullRequest.lastComment.edges[0];
    const reviews = pullRequest.reviews.edges;

    const dateEdges = [lastComment].concat(reviews);
    const maxDateString = dateEdges
        .filter(edge => edge && edge.node && edge.node.updatedAt)
        .map(edge => edge.node.updatedAt)
        .sort((a, b) => a < b ? 1 : -1)[0];

    const today = new Date();

    // check if last updated message was sent x days ago
    if (maxDateString && new Date(maxDateString) < addDays(today, -numberOfDaysWithoutActivity)) {
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

    if (ACTIVATE_MUTATION) {
        decisions.forEach(d => {
            const assigneesLogins = d.pullRequest.assignees.edges.map(edge => edge.node.login);
            const loginOfUsersToAlert = assigneesLogins.concat([d.pullRequest.author.login]);

            commentGitHubPullRequest(
                githubApiHeaders,
                d.pullRequest.id,
                `This PR seems inactive. ${loginOfUsersToAlert.map(login => "@" + login).join(' ')} Do you need help to complete this issue?`);
        });
    }

    return decisions;
}
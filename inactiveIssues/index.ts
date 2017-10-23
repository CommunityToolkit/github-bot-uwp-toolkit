import { addDays, distinct } from '../shared/utils';
import { completeFunction } from '../shared/functions';
import { IssueNode } from '../shared/models';
import { getAllMilestones, getAllGitHubIssuesRecursively, commentGitHubIssue, closeGitHubIssue } from '../shared/github';

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

            getAllGitHubIssuesRecursively(
                githubApiHeaders,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
                null,
                (issues) => {
                    const exclusiveLabels = [
                        'PR in progress',
                        'work in progress',
                        'help wanted',
                        'uservoice-entry-created',
                        'mute-bot'
                    ];

                    // only check issues in the current milestone or not in a milestone
                    // only check issues without exlusive labels
                    const issuesToCheck = issues
                        .filter(issue => {
                            return (!issue.milestone || issue.milestone.number <= currentMilestone.number);
                        })
                        .filter(issue => {
                            return !isIssueContainsExclusiveLabels(issue, exclusiveLabels);
                        });

                    const issuesInTheCurrentMilestone = issuesToCheck
                        .filter(issue => issue.milestone && issue.milestone.number === currentMilestone.number);

                    const issuesNotInMilestone = issuesToCheck
                        .filter(issue => !issue.milestone || issue.milestone.number < currentMilestone.number);

                    const numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');

                    const inactiveIssuesInTheCurrentMilestone = issuesInTheCurrentMilestone.filter(issue => {
                        return detectIssueWithoutActivity(issue, numberOfDaysWithoutActivity * 2);
                    });

                    const inactiveIssuesNotInMilestone = issuesNotInMilestone.filter(issue => {
                        return detectIssueWithoutActivity(issue, numberOfDaysWithoutActivity);
                    });

                    const decisions1 = makeDecisionsForIssuesInCurrentMilestone(githubApiHeaders, inactiveIssuesInTheCurrentMilestone);
                    const decisions2 = makeDecisionsForIssuesNotInMilestone(githubApiHeaders, inactiveIssuesNotInMilestone);

                    const decisions = decisions1.concat(decisions2);

                    context.log(decisions);
                    completeFunction(context, null, { status: 201, body: decisions });
                });
        });
}

type IssueActivityDecision = {
    issue: IssueNode;
    numberOfAlertsAlreadySent: number;
    decision: 'close' | 'alert';
    inCurrentMilestone: boolean;
}

const detectNumberOfAlertsAlreadySent = (botUsername: string, issue: IssueNode): number => {
    // less than 3 messages or
    // check if last messages of the issue contains less than 2 successive messages of the bot
    const lastTwoMessages = issue.lastTwoComments.edges.map(edge => edge.node);

    let numberOfAlertsAlreadySent = 0;

    for (let i = lastTwoMessages.length - 1; i >= 0; i--) {
        const message = lastTwoMessages[i];

        if (message.author.login === botUsername && message.body.indexOf('This issue seems inactive') > -1) {
            numberOfAlertsAlreadySent++;
        } else {
            break;
        }
    }

    return numberOfAlertsAlreadySent;
}

const detectIssueWithoutActivity = (issue: IssueNode, numberOfDaysWithoutActivity: number): boolean => {
    // check if at least two users write a message (one user other than the author)
    const loginsOfAuthors: string[] = distinct(issue.commentAuthors.edges.map(edge => edge.node.author.login));
    const issueHasResponse = distinct(loginsOfAuthors.filter(c => c !== issue.author.login)).length > 0;

    if (issueHasResponse) {
        // check if last message was sent x days ago
        const lastComment = issue.lastComment.edges[0];
        const today = new Date();

        if (lastComment && new Date(lastComment.node.updatedAt) < addDays(today, -numberOfDaysWithoutActivity)) {
            return true;
        }
    }

    return false;
}

const isIssueContainsExclusiveLabels = (issue: IssueNode, exclusiveLabels: string[]): boolean => {
    return issue.labels.edges
        .map(edge => edge.node)
        .some(label => {
            return exclusiveLabels.some(l => l === label.name);
        });
}

const makeDecisionsForIssuesInCurrentMilestone = (githubApiHeaders: any, issues: IssueNode[]): IssueActivityDecision[] => {
    const decisions = issues.map<IssueActivityDecision>(issue => {
        return {
            issue: issue,
            numberOfAlertsAlreadySent: null,
            decision: 'alert',
            inCurrentMilestone: true
        };
    });

    if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
        decisions.forEach(d => {
            commentGitHubIssue(
                githubApiHeaders,
                d.issue.id,
                `This issue seems inactive. Do you need help to complete this issue?`);
        });
    }

    return decisions;
}

const makeDecisionsForIssuesNotInMilestone = (githubApiHeaders: any, issues: IssueNode[]): IssueActivityDecision[] => {
    // take a decision about the issue (send a new alert or close it)
    const decisions = issues.map<IssueActivityDecision>(issue => {
        const numberOfAlertsAlreadySent = detectNumberOfAlertsAlreadySent(
            process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME,
            issue);

        if (numberOfAlertsAlreadySent === 2) {
            return {
                issue: issue,
                numberOfAlertsAlreadySent: numberOfAlertsAlreadySent,
                decision: 'close',
                inCurrentMilestone: false
            };
        } else {
            return {
                issue: issue,
                numberOfAlertsAlreadySent: numberOfAlertsAlreadySent,
                decision: 'alert',
                inCurrentMilestone: false
            };
        }
    });

    if (process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION) {
        // send new alerts if it was that decision
        decisions.filter(d => d.decision === 'alert').forEach(d => {
            // send a message to the creator that issue will be close in X days
            const numberOfDaysWithoutActivity = parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY || '7');
            const daysBeforeClosingIssue = numberOfDaysWithoutActivity * (2 - d.numberOfAlertsAlreadySent);

            commentGitHubIssue(
                githubApiHeaders,
                d.issue.id,
                `This issue seems inactive. It will automatically be closed in ${daysBeforeClosingIssue} days if there is no activity.`);
        });

        // close issue if it was that decision
        decisions.filter(d => d.decision === 'close').forEach(d => {
            // close issue and send a message that issue got no answer from the creator
            commentGitHubIssue(
                githubApiHeaders,
                d.issue.id,
                'Issue is inactive. It was automatically closed.');

            closeGitHubIssue(
                githubApiHeaders,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER,
                process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME,
                d.issue.number,
                d.issue.id);
        });
    }

    return decisions;
}
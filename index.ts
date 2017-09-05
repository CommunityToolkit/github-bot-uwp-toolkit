import haunt = require('haunt');

const botUsername = 'user'; // TODO : use env variables
const exclusiveLabels = ['PR in progress', 'work in progress'];

const start = (username: string, password: string, repositoryUrl: string, tests: any) => {
    haunt.auth(username, password);

    haunt.repo({
        repo: repositoryUrl,
        tests: tests
    }, () => {
        console.log('running tests');
    });
}

const distinct = (array: any[]): any[] => {
    return array.filter((x, i, a) => {
        return a.indexOf(x) === i;
    });
}

const takeLastThree = (array: any[]): any[] => {
    return array.filter((_, i, a) => {
        return i >= a.length - 3;
    });
}

const addDays = (date: Date, days: number): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() + days);
    return newDate;
}

const tests = {
    'pull-requests': {
        'should send a message of linked non-closed issues when a PR is merged': (pr) => {
            if (pr.state !== 'closed') {
                // TODO : check if PR is merged

                // TODO : do not send a new message if one has already been added

                // TODO : get issues from `pr.issue_url`

                // TODO : check if there are unclosed issues

                // TODO : send a message with links to unclosed issues
            }
        }
    },

    'issues': {
        'should detect if there was no response from the community after a period of time': (issue) => {
            if (issue.state !== 'closed') {
                // TODO : check if there is only one user who write a message (the creator of the message)

                // TODO : check if the issue contains an exclusive labels (only issues without those labels are usable)

                // TODO : check if the first message was sent 7 days ago

                // TODO : send a message with a ping to the team
            }
        },

        'should send a reminder after a period of time, up to 2 successive alerts': (issue) => {
            if (issue.state !== 'closed') {
                // check if at least two users write a message (one user other than the author)
                const loginsOfAuthors: string[] = issue.comments.map(c => c.user.login);
                const issueHasResponse = distinct(loginsOfAuthors.filter(c => c !== issue.user.login)).length > 0;

                if (issueHasResponse) {
                    // check if the issue contains an exclusive labels (only issues without those labels are usable)
                    const containsExclusiveLabels = issue.labels.filter(label => {
                        return exclusiveLabels.some(l => l === label.name);
                    }).length > 0;

                    if (!containsExclusiveLabels) {
                        // check if last message was sent 7 days ago
                        const lastComment = issue.comments[issue.comments.length - 1];
                        const today = new Date();

                        if (new Date(lastComment.updated_at) < addDays(today, -7)) {
                            // less than 3 messages or
                            // check if last messages of the issue contains less than 2 successive messages of the bot
                            const lastThreeMessages = takeLastThree(issue.comments);
                            const reminderMessagesFromBot = lastThreeMessages.filter(c => {
                                return (c.user.login === botUsername && c.body.indexOf('This issue seems inactive') > -1);
                            });

                            if (issue.comments.length < 3 || reminderMessagesFromBot.length < 2) {
                                // send a message to the creator that issue will be close in X days
                                const daysBeforeClosingIssue = 7 * (2 - reminderMessagesFromBot.length);

                                issue.comment(`This issue seems inactive. It will automatically be closed in ${daysBeforeClosingIssue} days if there is no activity.`);
                            }
                        }
                    }
                }
            }
        },

        'should close the issue after 3 successive alerts': (issue) => {
            if (issue.state !== 'closed') {
                // TODO : check if at least two users write a message

                // TODO : check if the issue contains an exclusive labels (only issues without those labels are usable)

                // TODO : check if last message was sent 7 days ago

                // TODO : check if last messages of the issue contains exactly 2 successive messages of the bot

                // TODO : close issue and send a message that issue got no answer from the creator
            }
        }
    }
}

// TODO : execute CRON task
// TODO : use env variables
start(botUsername, 'pass', 'http://github.com/my/repo', tests);
import haunt = require('haunt');

const start = (username: string, password: string, repositoryUrl: string, tests: any) => {
    haunt.auth(username, password);

    haunt.repo({
        repo: repositoryUrl,
        tests: tests
    }, () => {
        console.log('running tests');
    });
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

                // TODO : check if the issue contains an exclusive labels

                // TODO : check if the first message was sent 7 days ago

                // TODO : send a message with a ping to the team
            }
        },

        'should send a reminder after a period of time, up to 2 successive alerts': (issue) => {
            if (issue.state !== 'closed') {
                // TODO : check if at least two users write a message

                // TODO : check if the issue contains an exclusive labels

                // TODO : check if last message was sent 7 days ago

                // TODO : check if last messages of the issue contains less than 2 successive messages of the bot

                // TODO : send a message to the creator of the issue that issue will be close in X days
            }
        },

        'should close the issue after 3 successive alerts': (issue) => {
            if (issue.state !== 'closed') {
                // TODO : check if at least two users write a message

                // TODO : check if the issue contains an exclusive labels

                // TODO : check if last message was sent 7 days ago
                
                // TODO : check if last messages of the issue contains exactly 2 successive messages of the bot

                // TODO : close issue and send a message that issue got no answer from the creator
            }
        }
    }
}

// TODO : execute CRON task
// TODO : use env variables
start('user', 'pass', 'http://github.com/my/repo', tests);
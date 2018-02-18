# GitHub Bot for UWP Toolkit

Bot written in node.js and hosting on Azure Functions to manage issues and Pull Requests of UWP Community Toolkit repository

## List of functions

### noResponseFromCommunityOnIssues

This function detects issues without response.
It automatically send a message to a member of the team.

### inactiveIssues

This function detects inactive issues (a discussion has already started but no one started to work or closed the issue).

The first time (X days after the last message), an alert/message is sent.
The second time, another alert/message is sent.
And the third time, the issue is closed

### inactivePRs

This function detects inactive Pull Requests.

Send an alert every two weeks to the creator of the PR.

### unclosedIssuesInMergedPr

This function listens a GitHub webhook event when a PR is merged.
Then, using the `pull_request` it will detect the linked issues that are not closed and send a message with the id/number of issues left open.

### pendingUservoiceCreation

This function detects issues with `pending-uservoice-creation` label.

## How to use?

1. First, build the project using `tsc` command line.
    * Note: if you do not have `tsc` installed, execute `npm install -g typescript`
2. Fill the required environment variables to launch the bot (see next section)
3. Open the folder related to the function you want to execute
4. Execute `node index` command line to start the bot function

## Environment variables

These environment variables should be set to launch the bot.

| Variable | Description |
|-|-|
| GITHUB_BOT_UWP_TOOLKIT_USERNAME               | Username of the GitHub account of the bot |
| GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN           | Personal Access Token used to retrieve data from the GitHub API |
| GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER             | Target Repository owner (should be "Microsoft") |
| GITHUB_BOT_UWP_TOOLKIT_REPO_NAME              | Target Repository name (should be "UWP Community Toolkit") |
| GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION      | Activate GitHub mutation calls (false by default) |
| NUMBER_OF_DAYS_WITHOUT_ACTIVITY               | Number of days without activity to check on `inactiveIssues` function (7 days by default) |
| NUMBER_OF_DAYS_WITHOUT_RESPONSE               | Number of days without response to check on `noResponseFromCommunityOnIssues` function (7 days by default) |
# GitHub Bot for UWP Toolkit

Bot written in node.js to manage issues and Pull Requests of UWP Community Toolkit repository

## How to use?

1. First, build the project using `tsc` command line.
    * Note: if you do not have `tsc` installed, execute `npm install -g typescript`
2. Fill the required environment variables to launch the bot (see next section)
3. Execute `node index` command line to start the bot

## Environment variables

These environment variables should be set to launch the bot.

| Variable | Description |
|-|-|
| GITHUB_BOT_UWP_TOOLKIT_USERNAME               | Username of the GitHub account of the bot |
| GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN           | Personal Access Token used to retrieve data from the GitHub API |
| GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER             | Target Repository owner (should be "Microsoft") |
| GITHUB_BOT_UWP_TOOLKIT_REPO_NAME              | Target Repository name (should be "UWP Community Toolkit") |
| GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION      | Activate GitHub mutation calls (false by default) |
| NUMBER_OF_DAYS_WITHOUT_ACTIVITY               | Number of days without activity to check on `closeInactiveIssues` function |
| NUMBER_OF_DAYS_WITHOUT_RESPONSE               | Number of days without response to check on `noResponseFromCommunityOnIssues` function |
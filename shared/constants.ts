export const BOT_USERNAME = process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME || 'uwptoolkitbot';
export const ACCESS_TOKEN = process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN;
export const REPO_OWNER = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER || 'windows-toolkit';
export const REPO_NAME = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME || 'WindowsCommunityToolkit';
export const ACTIVATE_MUTATION = process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION === 'true' ? true : false;
export const NUMBER_OF_DAYS_WITHOUT_ACTIVITY = process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY) : 7;
export const NUMBER_OF_DAYS_WITHOUT_RESPONSE = process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE) : 7;
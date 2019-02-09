export const BOT_LOGIN = process.env.GITHUB_BOT_LOGIN || 'windowstoolkitbot';
export const ACCESS_TOKEN = process.env.GITHUB_BOT_ACCESS_TOKEN;
export const TARGET_REPO_OWNER = process.env.GITHUB_BOT_TARGET_REPO_OWNER || 'windows-toolkit';
export const TARGET_REPO_NAME = process.env.GITHUB_BOT_TARGET_REPO_NAME || 'WindowsCommunityToolkit';
export const ACTIVATE_MUTATION = process.env.GITHUB_BOT_ACTIVATE_MUTATION === 'true' ? true : false;
export const NUMBER_OF_DAYS_WITHOUT_ACTIVITY = process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY) : 7;
export const NUMBER_OF_DAYS_WITHOUT_RESPONSE = process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE) : 7;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOT_USERNAME = process.env.GITHUB_BOT_UWP_TOOLKIT_USERNAME || 'uwptoolkitbot';
exports.ACCESS_TOKEN = process.env.GITHUB_BOT_UWP_TOOLKIT_ACCESS_TOKEN;
exports.REPO_OWNER = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_OWNER || 'windows-toolkit';
exports.REPO_NAME = process.env.GITHUB_BOT_UWP_TOOLKIT_REPO_NAME || 'WindowsCommunityToolkit';
exports.ACTIVATE_MUTATION = process.env.GITHUB_BOT_UWP_TOOLKIT_ACTIVATE_MUTATION === 'true' ? true : false;
exports.NUMBER_OF_DAYS_WITHOUT_ACTIVITY = process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY) : 7;
exports.NUMBER_OF_DAYS_WITHOUT_RESPONSE = process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE) : 7;
//# sourceMappingURL=constants.js.map
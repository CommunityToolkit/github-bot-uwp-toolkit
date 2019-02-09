"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOT_LOGIN = process.env.GITHUB_BOT_LOGIN || 'windowstoolkitbot';
exports.ACCESS_TOKEN = process.env.GITHUB_BOT_ACCESS_TOKEN;
exports.TARGET_REPO_OWNER = process.env.GITHUB_BOT_TARGET_REPO_OWNER || 'windows-toolkit';
exports.TARGET_REPO_NAME = process.env.GITHUB_BOT_TARGET_REPO_NAME || 'WindowsCommunityToolkit';
exports.ACTIVATE_MUTATION = process.env.GITHUB_BOT_ACTIVATE_MUTATION === 'true' ? true : false;
exports.NUMBER_OF_DAYS_WITHOUT_ACTIVITY = process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_ACTIVITY) : 7;
exports.NUMBER_OF_DAYS_WITHOUT_RESPONSE = process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE ? parseInt(process.env.NUMBER_OF_DAYS_WITHOUT_RESPONSE) : 7;
//# sourceMappingURL=constants.js.map
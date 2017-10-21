"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tests_1 = require("../shared/tests");
var unclosedIssuesInMergedPr = require('../unclosedIssuesInMergedPr');
unclosedIssuesInMergedPr(tests_1.createFakeContext('unclosedIssuesInMergedPr'), {
    action: 'closed',
    number: 1563,
    pull_request: {
        merged: true
    }
});
//# sourceMappingURL=unclosedIssuesInMergedPr.js.map
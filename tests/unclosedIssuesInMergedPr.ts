import { createFakeContext } from '../shared/tests';

const unclosedIssuesInMergedPr = require('../unclosedIssuesInMergedPr');

unclosedIssuesInMergedPr(createFakeContext('unclosedIssuesInMergedPr'), {
    action: 'closed',
    number: 1563,
    pull_request: {
        merged: true
    }
});
import { createFakeContext } from '../shared/tests';

const closeInactiveIssues = require('../closeInactiveIssues');

closeInactiveIssues(createFakeContext('closeInactiveIssues'));
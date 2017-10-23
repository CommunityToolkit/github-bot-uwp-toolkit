import { createFakeContext } from '../shared/tests';

const inactiveIssues = require('../inactiveIssues');

inactiveIssues(createFakeContext('inactiveIssues'));
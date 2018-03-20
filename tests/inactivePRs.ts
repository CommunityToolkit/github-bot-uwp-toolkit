import { createFakeContext } from '../shared/tests';

const inactivePRs = require('../inactivePRs');

inactivePRs(createFakeContext('inactivePRs'));
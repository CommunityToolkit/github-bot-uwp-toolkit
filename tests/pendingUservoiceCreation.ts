import { createFakeContext } from '../shared/tests';

const pendingUservoiceCreation = require('../pendingUservoiceCreation');

pendingUservoiceCreation(createFakeContext('pendingUservoiceCreation'));
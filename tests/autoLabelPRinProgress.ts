import { createFakeContext } from '../shared/tests';

const autoLabelPRinProgress = require('../autoLabelPRinProgress');

autoLabelPRinProgress(createFakeContext('autoLabelPRinProgress'), {
    number: 1824,
    action: 'opened'
});
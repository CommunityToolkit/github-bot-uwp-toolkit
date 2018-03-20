"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeFunction = function (context, request, response) {
    if (request) {
        context.done(null, response);
    }
    else {
        context.done();
    }
};
exports.completeFunctionBySendingMail = function (context, personalizations, mailFrom, subject, content) {
    context.done(null, {
        personalizations: personalizations,
        from: mailFrom,
        subject: subject,
        content: content
    });
};
exports.searchLinkedItemsNumbersInComment = function (message) {
    var matches = message.match(/[#][0-9]+/g);
    if (matches) {
        return matches.map(function (m) { return parseInt(m.trim().substr(1)); });
    }
    return [];
};
//# sourceMappingURL=functions.js.map
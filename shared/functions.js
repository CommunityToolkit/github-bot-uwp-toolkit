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
//# sourceMappingURL=functions.js.map
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
//# sourceMappingURL=functions.js.map
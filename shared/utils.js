"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distinct = function (array) {
    return array.filter(function (x, i, a) {
        return a.indexOf(x) === i;
    });
};
exports.addDays = function (date, days) {
    var newDate = new Date();
    newDate.setDate(date.getDate() + days);
    return newDate;
};
//# sourceMappingURL=utils.js.map
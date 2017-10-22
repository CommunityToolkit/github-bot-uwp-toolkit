"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var writeLog = function (filename, content, callback) {
    fs.appendFile(filename, JSON.stringify(content), 'utf8', function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    });
};
exports.createFakeContext = function (functionName) {
    return {
        log: function (content) {
            console.log(content);
            var today = new Date();
            writeLog(functionName + "_" + today.toLocaleDateString().replace(/-/g, '') + "_" + today.toLocaleTimeString().replace(/:/g, '') + ".log", content, function (err) {
                if (err) {
                    console.log(err.message);
                }
            });
        },
        done: function () {
            console.log('function done');
        }
    };
};
//# sourceMappingURL=tests.js.map
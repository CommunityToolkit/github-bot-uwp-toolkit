"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var querystring = require("querystring");
var https = require("https");
exports.performHttpRequest = function (host, endpoint, method, headers, data, success) {
    var dataString = JSON.stringify(data);
    var requestHeaders = __assign({}, headers);
    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    }
    else {
        requestHeaders = __assign({}, requestHeaders, { 'Content-Type': 'application/json', 'Content-Length': dataString.length });
    }
    var options = {
        host: host,
        path: endpoint,
        method: method,
        headers: requestHeaders
    };
    var req = https.request(options, function (res) {
        res.setEncoding('utf-8');
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });
        res.on('end', function () {
            var responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });
    req.write(dataString);
    req.end();
};
//# sourceMappingURL=http.js.map
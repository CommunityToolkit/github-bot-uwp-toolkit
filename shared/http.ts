import * as querystring from 'querystring';
import * as https from 'https';

export const performHttpRequest = (host: string, endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', headers: any, data: any, success: (response: any) => any) => {
    const dataString = JSON.stringify(data);
    let requestHeaders = { ...headers };

    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    } else {
        requestHeaders = {
            ...requestHeaders,
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }

    const options = {
        host: host,
        path: endpoint,
        method: method,
        headers: requestHeaders
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf-8');

        let responseString = '';

        res.on('data', (data) => {
            responseString += data;
        });

        res.on('end', () => {
            const responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });

    req.write(dataString);
    req.end();
}
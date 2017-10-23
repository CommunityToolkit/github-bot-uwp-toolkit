import * as fs from 'fs';

const writeLog = (filename: string, content: any, callback?: (err?: NodeJS.ErrnoException) => any) => {
    fs.appendFile(filename, JSON.stringify(content) + '\r\n', 'utf8', (err) => {
        if (err) {
            callback(err);
            return;
        }

        callback();
    });
}

export const createFakeContext = (functionName: string) => {
    return {
        log: (content: any) => {
            console.log(content);

            const today = new Date();
            writeLog(`${functionName}_${today.toLocaleDateString().replace(/-/g, '')}_${today.toLocaleTimeString().replace(/:/g, '')}.log`, content, (err) => {
                if (err) {
                    console.log(err.message);
                }
            });
        },
        done: () => {
            console.log('function done');
        }
    };
}
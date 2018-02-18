export const completeFunction = (context: any, request: any, response: any) => {
    if (request) {
        context.done(null, response);
    } else {
        context.done();
    }
}

export const completeFunctionBySendingMail = (context: any, personalizations: any[], mailFrom: { email: string }, subject: string, content: any) => {
    context.done(null, {
        personalizations: personalizations,
        from: mailFrom,
        subject: subject,
        content: content
    });
}

export const searchLinkedItemsNumbersInComment = (message: string): number[] => {
    const matches = message.match(/[#][0-9]+/g);

    if (matches) {
        return matches.map(m => parseInt(m.trim().substr(1)));
    }
    return [];
}
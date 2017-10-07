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
export const completeFunction = (context: any, request: any, response: any) => {
    if (request) {
        context.done(null, response);
    } else {
        context.done();
    }
}
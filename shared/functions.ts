import { PullRequest, IssueNode } from "./models";

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

export const containsExclusiveLabels = (rootNode: IssueNode | PullRequest, exclusiveLabels: string[]): boolean => {
    return rootNode.labels.edges
        .map(edge => edge.node)
        .some(label => {
            return exclusiveLabels.some(l => l === label.name);
        });
}
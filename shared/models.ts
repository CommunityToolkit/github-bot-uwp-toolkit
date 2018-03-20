export type IssueNode = {
    id: string;
    number: number;
    author: {
        login: string
    };
    createdAt: string;
    comments: {
        totalCount: number
    };
    lastComment: {
        edges: {
            node: {
                updatedAt: string
            }
        }[];
    };
    lastTwoComments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
    commentAuthors: {
        edges: {
            node: {
                author: {
                    login: string
                },
            }
        }[];
    };
    labels: {
        edges: {
            node: {
                name: string
            }
        }[];
    };
    milestone: MilestoneWithNumberAndState | undefined;
}

export type PullRequestNode = {
    id: string;
    body: string;
    comments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
}

export type IssueOrPullRequestLinkNode = {
    __typename: 'Issue';
    id: string;
    number: number;
    closed: boolean;
} | {
        __typename: 'PullRequest';
    };

export type Milestone = {
    id: string;
    state: 'CLOSED' | 'OPEN';
    dueOn: string;
    number: number;
}

export type MilestoneWithNumberAndState = {
    number: number;
    state: 'OPEN' | 'CLOSED';
}

export type PullRequest = {
    id: string;
    number: number;
    author: {
        login: string
    };
    createdAt: string;
    comments: {
        totalCount: number
    };
    lastComment: {
        edges: {
            node: {
                updatedAt: string
            }
        }[];
    };
    lastTwoComments: {
        edges: {
            node: {
                author: {
                    login: string
                },
                body: string
            }
        }[];
    };
    labels: {
        edges: {
            node: {
                name: string
            }
        }[];
    };
    milestone: MilestoneWithNumberAndState | undefined;
}

export type IssueWithLabels = {
    number: number;
    labels: string[];
}
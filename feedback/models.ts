export type FeedbackAction = 'CREATE' | 'ANSWER' | 'LIKE' | 'DISLIKE' | 'ISSUES';
export interface FeedbackComment {
    id?: number;
    title?: string;
    text: string;
    target?: number;
    feedbackId?: number;
}

export interface FeedbackVote {
    id?: number;
    rate: number;
    title: string;
    description?: string;
    feedbackId?: number;
}
export interface FeedbackRequest {
    id?: number;
    action: FeedbackAction;
    comment: FeedbackComment;
    votes: Array<FeedbackVote>;
    tags: number[];
    likes: Array<FeedbackLike>;
    dislikes: Array<FeedbackLike>;
}

export interface FeedbackLike {
    id?: number;
    feedbackId: number;
    userId?: number;
    datetime_create?: string;
    datetime_update?: string;
}

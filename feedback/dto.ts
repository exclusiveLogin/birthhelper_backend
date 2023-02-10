import {FeedbackAction} from "./models";

export interface FeedbackVoteDTO {
    rate: number;
    slug: string;
}

export interface FeedbackLikeDTO {
    feedbackId: number;
    userId?: number;
}

export interface FeedbackDTO {
    id?: number;
    action: FeedbackAction;
    comment: string;
    votes: Array<FeedbackVoteDTO>;
    tags?: number[];
}

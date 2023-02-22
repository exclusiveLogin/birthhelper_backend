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
    target_entity_key: string;
    target_entity_id: number;
    comment: string;
    votes: Array<FeedbackVoteDTO>;
    tags?: number[];
}
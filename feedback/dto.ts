import {FeedbackAction} from "./models";

export interface FeedbackCommentDTO {
    id?: number;
    title?: string;
    text: string;
    targetId?: number;
    feedbackId?: number;
    userId?: number;
}

export interface FeedbackVoteDTO {
    id?: number;
    rate: number;
    title: string;
    description?: string;
    feedbackId?: number;
}

export interface FeedbackLikeDTO {
    id?: number;
    feedbackId: number;
    userId?: number;
}

export interface FeedbackRequestDTO {
    id?: number;
    action: FeedbackAction;
    comment: FeedbackCommentDTO;
    votes: Array<FeedbackVoteDTO>;
    tags: number[];
    likes: Array<FeedbackLikeDTO>;
    dislikes: Array<FeedbackLikeDTO>;
}

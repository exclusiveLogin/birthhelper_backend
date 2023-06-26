import { Comment } from "../comment/model";
import { Vote } from "../vote/model";
import { Like } from "../like/model";
import { User } from "../models/user.interface";

export type FeedbackAction =
  | "GET"
  | "CREATE"
  | "REMOVE_FEEDBACK"
  | "REMOVE_COMMENT"
  | "EDIT"
  | "ANSWER"
  | "REPLY"
  | "LIKE"
  | "DISLIKE"
  | "UNLIKE"
  | "ISSUES"
  | "STATUS_CHANGE";

export type FeedbackStatus =
  | "pending"
  | "approved"
  | "verified"
  | "blocked"
  | "reject"
  | "official"
  | "deleted";

export interface FeedbackResponse extends Feedback {
  action: FeedbackAction;
  comment: Comment;
  votes: Array<Vote>;
  likes: Array<Like>;
  dislikes: Array<Like>;
  user: User;
}

export interface FeedbackResponseByContragent {
  contragentId: number;
  byCore: FeedbackResponse[];
  bySlots: FeedbackResponse[];
  total: number;
}

export interface Feedback {
  id: number;
  target_entity_key: string;
  target_entity_id: number;
  user_id: number;
  status: FeedbackStatus;
  datetime_create: string;
  datetime_update: string;
}
export interface SummaryVotes {
  avr: number;
  min: number;
  max: number;
  total: number;
}

export interface RateByVote extends SummaryVotes {
  slug: string;
}

export interface SummaryRateByTargetResponse {
  summary: SummaryVotes;
  summary_by_votes: Array<RateByVote>;
}

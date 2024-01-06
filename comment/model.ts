import { Like } from "like/model";

export type FeedbackCommentStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "deleted"
    | "branched"
    | "official";

export type FeedbackCommentType =
    | "master"
    | "reply";

export interface Comment {
  id: number;
  feedback_id: number;
  user_id: number;
  text: string;
  comment_id?: number;
  replies: number;
  status?: FeedbackCommentStatus;
  type?: FeedbackCommentType;
  datetime_update?: string;
  datetime_create?: string;
  likes: Like[];
  dislikes: Like[];
}

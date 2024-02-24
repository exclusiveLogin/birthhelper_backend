export type LikeSource = "comment" | "feedback";
export type LikeType = 'like' | 'dislike';

export interface Like {
  id: number;
  status: LikeStatusType;
  target_id: number;
  target_type: LikeSource;
  user_id: number;
  datetime_create: string;
}

export type LikeStatusType = "active" | "deleted";

export type Reactions = { 
  likes: Like[]; 
  dislikes: Like[], 
  likeOwner: boolean, 
  dislikeOwner: boolean,
};
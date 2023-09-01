export type LikeType = "comment" | "feedback";
export interface Like {
  id: number;
  status: LikeStatusType;
  target_id: number;
  target_type: LikeType;
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
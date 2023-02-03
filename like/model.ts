export type LikeType = 'comment'| 'feedback';
export interface Like {
    id: number;
    target_id: number;
    target_type: LikeType;
    user_id: number;
    datetime_create: string;
}

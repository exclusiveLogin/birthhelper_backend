export interface Comment {
    id?: number;
    feedback_id: number
    user_id: number
    text: string;
    comment_id?: number;
    replies: number;
    datetime_update?: string;
    datetime_create?: string;
}

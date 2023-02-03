export interface Comment {
    id?: number;
    feedback_id: number
    user_id: number
    title: string;
    description?: string;
    comment_id?: number;
    datetime_update?: string;
    datetime_create?: string;
}

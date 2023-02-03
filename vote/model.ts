export interface Vote {
    id: number;
    vote_slug: number
    feedback_id: number
    user_id: number
    title: string;
    rate: number;
    datetime_update: string;
    datetime_create: string;
}

export interface IUser {
    id: number;
    login: string;
    password: string;
    image: string;
    datetime_create: string;
    datetime_update: string;
}

export interface UserRole {
    id: number;
    slug: string;
    title: string;
    description: string;
    rank: number;
    datetime_create: string;
    datetime_update: string;
}

export interface UserSession {
    id: number;
    token: string;
    user_id: number;
    datetime_create: string;
    datetime_update: string;
}

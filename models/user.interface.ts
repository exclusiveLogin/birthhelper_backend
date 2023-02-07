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

export interface UserSrc {
    id: number;
    active: number;
    activation: string;
    login: string;
    password: string;
    role: number;
    first_name: string;
    last_name: string;
    patronymic: string;
    photo_id: number;
    status_type: number;
    multi_pregnant: number;
    client_birthday_datetime: string;
    conception_datetime: string;
    has_problems: number;
    phone: string;
    email: string;
    skype: string;
    ch_skype: number;
    ch_phone: number;
    ch_viber: number;
    ch_whatsapp: number;
    ch_telegram: number;
    ch_email: number;
    height: number;
    weight: number;
    clothes_size: number;
    shoes_size: number;
    datetime_create: string;
    datetime_update: string;
}

export interface UserExit {
    exit: boolean;
    msg: string;
    token: string;
    user: number;
}

export class User {
    id: number;
    active: boolean;
    login: string;
    password: string;
    role: number;
    first_name: string;
    last_name: string;
    patronymic: string;
    photo_id: number;
    status_type: number;
    multi_pregnant: boolean;
    client_birthday_datetime: string;
    conception_datetime: string;
    has_problems: boolean;
    phone: string;
    email: string;
    skype: string;
    ch_skype: boolean;
    ch_phone: boolean;
    ch_viber: boolean;
    ch_whatsapp: boolean;
    ch_telegram: boolean;
    ch_email: boolean;
    height: number;
    weight: number;
    clothes_size: number;
    shoes_size: number;
    activation: string;

    constructor(src: UserSrc) {
        this.multi_pregnant = !!src.multi_pregnant;
        this.has_problems = !!src.has_problems;
        this.ch_skype = !!src.ch_skype;
        this.ch_phone = !!src.ch_phone;
        this.ch_viber = !!src.ch_viber;
        this.ch_whatsapp = !!src.ch_whatsapp;
        this.ch_telegram = !!src.ch_telegram;
        this.ch_email = !!src.ch_email;
        this.active = !!src.active;
        this.activation = src.activation;

        this.id = src.id;
        this.login = src.login;
        this.password = src.password;
        this.role = src.role;
        this.first_name = src.first_name;
        this.last_name = src.last_name;
        this.patronymic = src.patronymic;
        this.photo_id = src.photo_id;
        this.status_type = src.status_type;
        this.client_birthday_datetime = src.client_birthday_datetime;
        this.conception_datetime = src.conception_datetime;
        this.phone = src.phone;
        this.email = src.email;
        this.skype = src.skype;
        this.height = src.height;
        this.weight = src.weight;
        this.clothes_size = src.clothes_size;
        this.shoes_size = src.shoes_size;
    }
}

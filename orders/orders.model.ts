import {FilterParams} from "../entity/entity_engine";
import {EntityKeys} from "../entity/entity_repo.model";
import {User} from "../models/user.interface";
import {EntityType} from "../config/config_repo";

export enum ODRER_ACTIONS {
    GET = 'GET',
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    CLEAR = 'CLEAR',
    SUBMIT = 'SUBMIT',
    RESOLVE = 'RESOLVE',
    REJECT = 'REJECT',
    CANCEL = 'CANCEL',
    COMPLETE = 'COMPLETE',
    SENDBYORG = 'SENDBYORG',
}

export enum STATUSES {
    pending = 'pending',
    deleted = 'deleted',
    waiting = 'waiting',
    resolved = 'resolved',
    rejected = 'rejected',
    completed = 'completed',
    canceled = 'canceled',
    progressing = 'progressing',
    inwork = 'inwork',
    incomplete = 'incomplete',
    inplan = 'inplan',
}

export type StatusType = keyof typeof STATUSES;

export interface OrderSrc  {
    id: number;
    user_id: number;
    session_id: string;
    slot_entity_key: string;
    slot_entity_id: number;
    refferer: number;
    status: string;
    group_token: string;
    contragent_entity_key?: string;
    contragent_entity_id?: number;
    section_key?: string;
    tab_key?: string;
    floor_key?: string;
    utility?: string;
    datetime_update: string;
    datetime_create: string;
}
export interface OrderContacts {
    phone: string;
    email: string;
    skype: string;
    ch_email: boolean;
    ch_phone: boolean;
    ch_skype: boolean;
    ch_viber: boolean;
    ch_telegram: boolean;
    ch_whatsapp: boolean;
}
export type OrderGroupMode = 'order' | 'session';

export interface OrderPayload {
    action: ODRER_ACTIONS;
    ent_key?: EntityKeys;
    ent_id?: number;
    contragent_entity_key?: string;
    contragent_entity_id?: number;
    tab_key?: string;
    floor_key?: string;
    section_key?: string;
    id?: number;
    count?: number;
    group_token?: string;
    filters?: FilterParams;
    contacts?: OrderContacts;
    status?: StatusType;
    groupMode?: OrderGroupMode;
    utility?: EntityType;
    limit?: number;
    skip?: number;
}

export interface OrderContacts {
    id: number;
    group_token: string;
    user_id: number;
    session_id: number;
    phone: string;
    email: string;
    skype: string;
    ch_email: boolean;
    ch_phone: boolean;
    ch_viber: boolean;
    ch_whatsapp: boolean;
    ch_skype: boolean;
    ch_telegram: boolean;
    datetime_create: string;
    datetime_update: string;
}

export interface OrderGroup {
    group_id: string;
    groupMode: OrderGroupMode;
    user: User;
    contacts: OrderContacts;
    orders: Order[];
}

export class Order {
    id: number;
    user_id: number;
    session_id: string;
    slot_entity_key: string;
    slot_entity_id: number;
    refferer: number;
    status: string;
    group_token: string;
    contragent_entity_key?: string;
    contragent_entity_id?: number;
    section_key?: string;
    tab_key?: string;
    floor_key?: string;
    utility?: string;
    datetime_update: string;
    datetime_create: string;

    constructor(src: OrderSrc) {
        this.id = src.id;
        this.user_id = src.user_id;
        this.session_id = src.session_id;
        this.slot_entity_key = src.slot_entity_key;
        this.slot_entity_id = src.slot_entity_id;
        this.refferer = src.refferer;
        this.status = src.status;
        this.group_token = src.group_token;
        this.contragent_entity_key = src.contragent_entity_key;
        this.contragent_entity_id = src.contragent_entity_id;
        this.section_key = src.section_key;
        this.tab_key = src.tab_key;
        this.floor_key = src.floor_key;
        this.utility = src.utility;
        this.datetime_update = src.datetime_update;
        this.datetime_create = src.datetime_create;

    }
    static createOrderFromSrc(src: OrderSrc): Order {
        return new this(src);
    }

}

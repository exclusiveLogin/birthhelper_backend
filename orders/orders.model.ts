import {Entity, FilterParams} from "../entity/entity_engine";
import {EntityKeys} from "../entity/entity_repo.model";

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
    inprogress = 'inprogress',
    inwork = 'inwork',
    incomplete = 'incomplete',
    inplan = 'inplan',
}

export type StatusMode = 'complex' | 'simple';

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
    status_mode?: StatusMode;
    status?: StatusType;
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
    datetime_update: string;
    datetime_create: string;

    slot: Entity;

    constructor(src: OrderSrc) {
        this.id = src.id;
        this.user_id = src.user_id;
        this.session_id = src.session_id;
        this.slot_entity_key = src.slot_entity_key;
        this.slot_entity_id = src.slot_entity_id;
        this.refferer = src.refferer;
        this.status = src.status;
        this.group_token = src.group_token;
        this.datetime_update = src.datetime_update;
        this.datetime_create = src.datetime_create;

    }
    static createOrderFromSrc(src: OrderSrc): Order {
        return new this(src);
    }

    getContragent(): Entity {
        return this.slot?._contragent;
    }

    getContragentID(): number {
        return this.getContragent()?.id;
    }

}

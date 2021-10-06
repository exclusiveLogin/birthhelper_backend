import { Entity } from "../entity/entity_engine";

export enum ODRER_ACTIONS {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    SUBMIT = 'SUBMIT',
    RESOLVE = 'RESOLVE',
    REJECT = 'REJECT',
    CANCEL = 'CANCEL',
    COMPLETE = 'COMPLETE',
    SENDBYORG = 'SENDBYORG',
    
}

export type STATUSES = 
    'pending'   | 
    'deleted'   | 
    'waiting'   | 
    'resolved'  | 
    'rejected'  | 
    'completed' | 
    'canceled'  | 
    'inprogress';

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

    constructor(src: OrderSrc, slot: Entity) {
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
    static createOrderFromSrc(src: OrderSrc, slot: Entity): Order {
        return new this(src, slot);
    }

    getContragent(): Entity {
        return this.slot?._contragent;
    }

    getContragentID(): number {
        return this.getContragent()?.id;
    }

}
import {Context} from "../search/config";
import {User, UserSrc} from "../models/user.interface";
import {EntityKeys} from "../entity/entity_repo.model";
import {Entity} from "../entity/entity_engine";
export interface FriendModel {
    id: number;
    status: FriendStatus;
    user_id: number;
    target_id: number;
    target_key: string;
    datetime_update: string;
    datetime_create: string;
    datetime_delete: string;
}

export type BannedModel = Omit<FriendModel, 'status'> & {status: BlockedStatus};
export type FriendStatus = 'approved' | 'blocked' | 'declined' | 'pending' | 'deleted';
export type BlockedStatus = 'blocked';

export interface EditFriendRequest {
    status: FriendStatus;
}

export interface FriendMeta {
    active: {
        total: number;
        current: number;
    };
}

export interface FriendsRequestDTO {
    active: ReturnType<Friend['getSnapshot']>[];
    offered: ReturnType<Friend['getSnapshot']>[];
    pending: ReturnType<Friend['getSnapshot']>[];
    banned: ReturnType<Banned['getSnapshot']>[];
    meta?: {
        active: FriendMeta;
        offered: FriendMeta;
        banned: FriendMeta;
    }
}

export interface FriendStateDTO {
    isFriend: boolean;
    isOffered: boolean;
    isBlocked: boolean;
    isYourBanned: boolean;
    canFriendOffer: boolean;
}

export class Friend implements FriendModel{
    id: number;
    status: FriendStatus;
    user_id: number;
    target_id: number;
    target_key: EntityKeys;
    datetime_update: string;
    datetime_create: string;
    datetime_delete: string;

    user?: User;
    target?: User | Entity;

    #ready$: Promise<this>;

    async #enreach(){
        this.user= await this.context.entityEngine
            .getEntities<UserSrc>('ent_users', null, null, this.user_id)
            .toPromise()
            .then(usr => usr?.[0] ? new User(usr[0]) : null);

        this.target= await this.context.entityEngine
            .getEntities<UserSrc>(this.target_key, null, null, this.target_id)
            .toPromise()
            .then(usr => usr?.[0] ? this.target_key === 'ent_users' ? new User(usr[0]) : usr[0] : null);

        return this;
    }
    constructor(
        friendModel: FriendModel,
        private context: Context
    ) {
        Object.assign(this, friendModel);
        this.#ready$ = this.#enreach();
    }

    ready() {
        return this.#ready$.then(() => this);
    }

    getSnapshot(){
        return {
            id: this.id,
            status: this.status,
            user_id: this.user_id,
            target_id: this.target_id,
            target_key: this.target_key,
            datetime_update: this.datetime_update,
            datetime_create: this.datetime_create,
            datetime_delete: this.datetime_delete,

            user: this.user,
            target: this.target,
        }
    }
}

export class Banned implements BannedModel {
    id: number;
    status: BlockedStatus;
    user_id: number;
    target_id: number;
    target_key: EntityKeys;
    datetime_update: string;
    datetime_create: string;
    datetime_delete: string;

    user?: User;
    target?: User | Entity;

    #ready$: Promise<void>;

    async #enreach(){
        this.user= await this.context.entityEngine
            .getEntities<UserSrc>('ent_users', null, null, this.user_id)
            .toPromise()
            .then(usr => usr?.[0] ? new User(usr[0]) : null);

        this.target= await this.context.entityEngine
            .getEntities<UserSrc>(this.target_key, null, null, this.target_id)
            .toPromise()
            .then(usr => usr?.[0] ? this.target_key === 'ent_users' ? new User(usr[0]) : usr[0] : null);
    }
    constructor(
        friendModel: BannedModel,
        private context: Context
    ) {
        Object.assign(this, friendModel);
        this.#ready$ = this.#enreach();
    }

    ready() {
        return this.#ready$.then(() => this);
    }

    getSnapshot(){
        return {
            id: this.id,
            status: this.status,
            user_id: this.user_id,
            target_id: this.target_id,
            target_key: this.target_key,
            datetime_update: this.datetime_update,
            datetime_create: this.datetime_create,
            datetime_delete: this.datetime_delete,

            user: this.user,
            target: this.target,
        }
    }
}
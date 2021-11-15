
import * as express from "express";
import uuid = require('uuid');
import { CacheEngine } from "../cache.engine/cache_engine";
import { Response, Request, Router } from "express";
import { DataBaseService } from "../db/sql";
import { Context } from "../search.engine/config";
import { tap } from "rxjs/operators";
import { ODRER_ACTIONS, Order, STATUSES, StatusType } from "./orders.model";
import { EntityKeys } from "../entity/entity_repo.model";
import { OkPacket } from "mysql";
const bodyParser = require('body-parser');
const jsonparser = bodyParser.json();

export interface OrderPayload {
    action: ODRER_ACTIONS;
    ent_key: EntityKeys;
    ent_id: number;
    id?: number;
    count?: number;
}
export class OrderEngine {
    private orderRouter = express.Router();
    ce: CacheEngine;
    dbe: DataBaseService;
    ctx: Context;

    constructor(context: Context) {
        context.orderEngine = this;
        this.ctx = context;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }

    async getOrdersByUser(uid: number): Promise<Order[]> {
        const cacheKey = `orders_by_user_${uid}`;
        const fetchFromDB = (): Promise<Order[]> => {
            let q =
                `SELECT * 
                FROM \`orders\` 
                WHERE user_id = ${uid}`;

            return this.dbe.queryList<Order>(q).pipe(
                tap(data => this.ce.saveCacheData(cacheKey, data)),
            ).toPromise();
        };
        const existInCache = this.ce.checkCache(cacheKey);

        return existInCache
            ? this.ce.getCachedByKey<Order[]>(cacheKey).toPromise()
            : fetchFromDB()
        
    }

    async getOrdersBySession(sid: number): Promise<Order[]> {
        const cacheKey = `orders_by_session_${sid}`;
        const fetchFromDB = (): Promise<Order[]> => {
            let q =
                `SELECT * 
                FROM \`orders\` 
                WHERE session_id = ${sid}`;

            return this.dbe.queryList<Order>(q).pipe(
                tap(data => this.ce.saveCacheData(cacheKey, data)),
            ).toPromise();
        };
        const existInCache = this.ce.checkCache(cacheKey);

        return existInCache
            ? this.ce.getCachedByKey<Order[]>(cacheKey).toPromise()
            : fetchFromDB()
        
    }

    async getOrders(token: string): Promise<Order[]> {
        const uid = await this.getUserIDBySession(token);
        const authMode = await this.userISAuthorized(uid);
        const session = await this.getSessionByToken(token);

        return authMode 
            ? this.getOrdersByUser(uid) 
            : this.getOrdersBySession(session);
    }


    async getSessionByToken(token: string): Promise<number> {
        return token ? this.ctx.authorizationEngine.getSessionByToken(token) : null;
    }

    async getUserIDBySession(token: string): Promise<number> {
        return token ? this.ctx.authorizationEngine.getUserIdByToken(token) : null;
    }

    async userISAuthorized(uid: number): Promise<boolean> {
        if (!uid) return false;

        const role = await this.ctx.authorizationEngine.getRoleByUserId(uid);
        return role?.rank > 1;
    }

    async actionToOrder(token: string, action: ODRER_ACTIONS, payload: OrderPayload): Promise<OkPacket> {
        const {
            id,
            ent_id,
            ent_key, 
        } = payload;
        
        switch (action) {
            case ODRER_ACTIONS.ADD:
                return this.addOrderToUserCart(token, payload);
            case ODRER_ACTIONS.CANCEL:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.canceled)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.canceled)

            case ODRER_ACTIONS.COMPLETE:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.completed)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.completed)

            case ODRER_ACTIONS.REJECT:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.rejected)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.rejected)

            case ODRER_ACTIONS.RESOLVE:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.resolved)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.resolved)

            case ODRER_ACTIONS.REMOVE:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.deleted)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.deleted)

            case ODRER_ACTIONS.SUBMIT:
                const session_id = await this.getSessionByToken(token);
                if(!session_id) throw new Error('session not found');
                return this.submitGroupOrdersBySessionID(session_id, STATUSES.waiting);

            case ODRER_ACTIONS.SENDBYORG:
                return id 
                    ? this.changeStatusOrderById(id, STATUSES.inprogress)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.inprogress)
        }
        
        return Promise.reject('Action is unknown');
    }

    async actionHandler(req: Request, res: Response): Promise<void> {
        const token = await this.ctx.authorizationEngine.getToken(req);
        const action = req.body?.action as ODRER_ACTIONS;
        const payload = req.body;

        if (!action) {
            console.error('actionHandler: ', 'не передан action код');
            res.status(500);
            res.send({ error: 'Ошибка: Не передан код действия' });
            return;
        }

        try {
            const result = await this.actionToOrder(token, action, payload);
            res.send(JSON.stringify({ context: 'orders', result }));
        } catch (e) {
            res.status(500);
            res.send({ error: e });
        }

    }

    async addOrderToUserCart(token: string, payload: OrderPayload): Promise<OkPacket> {
        const { ent_id, ent_key } = payload;
        const user_id = await this.getUserIDBySession(token);
        const session_id = await this.getSessionByToken(token);
        const q = ` INSERT INTO \`orders\` 
                    (\`user_id\`, \`session_id\`, \`slot_entity_id\`, \`slot_entity_key\`, \`refferer\`, \`status\`)
                    VALUES (${user_id}, ${session_id}, ${ent_id}, "${ent_key}", ${user_id}, "pending")`;
        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }

    changeStatusOrderById(id: number, newStatus: StatusType): Promise<OkPacket> {
        const q = `UPDATE \`orders\` SET \`status\`= \"${newStatus}\" WHERE \`id\`=${id}`;
        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }

    submitGroupOrdersBySessionID(session_id: number, newStatus: StatusType): Promise<OkPacket> {
        const groupToken: string = uuid.v4();
        const q = ` UPDATE \`orders\` 
                    SET \`status\`= \"${newStatus}\",
                    \`group_token\`= \"${groupToken}\"
                    WHERE \`session_id\` = ${session_id}`;
        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }


    async changeStatusOrderByPair(
        token: string,
        ent_key: EntityKeys,
        ent_id: number,
        newStatus: StatusType
    ): Promise<OkPacket> {
        const user = await this.getUserIDBySession(token);
        const session = await this.getSessionByToken(token);
        const q =  `UPDATE \`orders\` 
                    SET \`status\`= \"${newStatus}\",
                        \`user_id\` = ${user} 
                    WHERE \`slot_entity_key\`= "${ent_key}"
                    AND \`slot_entity_id\`= ${ent_id}
                    AND \`session_id\` = ${session}`;

        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }

    async getOrdersHandler(req: Request, res: Response): Promise<void> {
        const token = await this.ctx.authorizationEngine.getToken(req);
        if (!token) {
            res.status(500);
            res.send({ error: 'Token not recieved' });
        }

        try {
            const result = await this.getOrders(token);
            res.send(JSON.stringify({ context: 'orders', result }));
        } catch (e) {
            res.status(500);
            res.send({ error: e });
        }
    }


    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end(JSON.stringify({ error: err }));
    }

    getRouter(): Router {
        this.orderRouter.get('/', 
            this.ctx.authorizationEngine.checkAccess.bind(this.ctx.authorizationEngine, null),
            this.getOrdersHandler.bind(this));

        this.orderRouter.post('/', 
            jsonparser,
            this.ctx.authorizationEngine.checkAccess.bind(this.ctx.authorizationEngine, null),
            this.actionHandler.bind(this));
        return this.orderRouter;
    }
}

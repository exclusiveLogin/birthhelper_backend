
import * as express from "express";
import { CacheEngine } from "../cache.engine/cache_engine";
import { Response, Request, Router } from "express";
import { from, Observable, throwError } from "rxjs";
import { generateFilterQStr } from "../db/sql.helper";
import { DataBaseService } from "../db/sql";
import { Context } from "../search.engine/config";
import { map, tap } from "rxjs/operators";
import { ODRER_ACTIONS, Order, STATUSES } from "./orders.model";
import { EntityKeys } from "../entity/entity_repo.model";
import { OkPacket } from "mysql";

export interface OrderPayload {
    action: ODRER_ACTIONS;
    ent_key: string;
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

    getOrdersByUser(uid: number): Promise<Order[]> {

        return
        // if(!dict) {
        //     return throwError(`Словарь ${id} не найден`);
        // }

        // const fetchFromDB = (): Observable<DictionaryItem[]> => {
        //     let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;

        //     let likeStr = [...generateFilterQStr(dict?.filters || [], 'string'), ...generateFilterQStr(dict?.filters || [], 'flag')].join(' AND ');
        //     let whereStr = [...generateFilterQStr(dict?.filters || [], 'id')].join(' AND ');

        //     let q =
        //         `SELECT * 
        //         FROM \`${ dict.db }\` 
        //         ${(whereStr) ? 'WHERE ' + whereStr : ''} 
        //         ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
        //         ${limstr}`;

        //     return this.dbe.queryList<DictionaryItem>(q).pipe(
        //         tap(data => this.ce.saveCacheData(`${id}`, data)),
        //         tap(result => {
        //             if( dict.titleMap || dict.titleAddMap ){
        //                 result && result.forEach( r => {
        //                     r.title = dict.titleMap.map(f => r[f]).join(', ');
        //                     r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
        //                 })
        //             }
        //         }),
        //     );
        // };

        // if(this.ce.checkCache(id)) {
        //     return this.ce.getCachedByKey(id);
        // } else {
        //     return fetchFromDB()
        // }
    }

    getOrdersBySession(sid: string): Promise<Order[]> {
        return
    }

    async getOrders(session_id: string): Promise<Order[]> {
        const uid = await this.getUserIDBySession(session_id);
        const authMode = await this.userISAuthorized(uid);

        return authMode ? await this.getOrdersByUser(uid) : this.getOrdersBySession(session_id);
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

    async actionToOrder(session_id: string, action: ODRER_ACTIONS, payload: OrderPayload): Promise<any> {
        switch (action) {
            case ODRER_ACTIONS.ADD:
                return this.addOrderToUserCart(session_id, payload);
            case ODRER_ACTIONS.CANCEL:


        }
        return Promise.reject('Action is unknown');
    }

    async actionHandler(req: Request, res: Response) {
        const session = await this.ctx.authorizationEngine.getToken(req);
        const action = req.body?.action as ODRER_ACTIONS;
        const payload = req.body;

        if (!action) {
            console.error('actionHandler: ', 'не передан action код');
            res.status(500);
            res.send({ error: 'Ошибка: Не передан код действия' });
        }

        try {
            const result = await this.actionToOrder(session, action, payload);
            res.send(JSON.stringify({ context: 'orders', result }));
        } catch (e) {
            res.status(500);
            res.send({ error: e });
        }

    }

    addOrderToUserCart(session_id, payload: OrderPayload): Promise<number> {
        
        return;
    }

    changeStatusOrderById(id: number, newStatus: STATUSES): Promise<OkPacket> {
        const q = `UPDATE \`orders\` SET \`status\`= \"${newStatus}\" WHERE \`id\`=${id}`;
        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }

    async changeStatusOrderByPair(
        token: string,
        ent_key: EntityKeys,
        ent_id: number,
        newStatus: STATUSES
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

    submitOrder(id) { }

    rejectOrder(id) { }

    resolveOrder(id) { }

    sendOrderToContragent(id) {

    }

    removeOrder(id) {

    }

    cancelOrder(id) {

    }

    completeOrder(id) {

    }

    getOrdersHandler(req: Request, res: Response): void {

    }


    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end(JSON.stringify({ error: err }));
    }

    getRouter(): Router {
        this.orderRouter.get('/', this.getOrdersHandler.bind(this));
        this.orderRouter.post('/', this.actionHandler.bind(this));
        return this.orderRouter;
    }
}

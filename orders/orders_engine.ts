
import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
import {from, Observable, throwError} from "rxjs";
import {generateFilterQStr} from "../db/sql.helper";
import {DataBaseService} from "../db/sql";
import {Context} from "../search.engine/config";
import {map, tap} from "rxjs/operators";
import { ODRER_ACTIONS, Order } from "./orders.model";

export class OrderEngine {
    private orderRouter = express.Router();
    ce: CacheEngine;
    dbe: DataBaseService;
    ctx:  Context;

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

    
    getUserIDBySession(token: string): Promise<number> {
        return token ? this.ctx.authorizationEngine.getUserIdByToken(token) : null;
    }

    async userISAuthorized(uid: number): Promise<boolean> {
        if(!uid) return false;

        const role = await this.ctx.authorizationEngine.getRoleByUserId(uid);
        return role?.rank > 1;
    }

    actionToOrder(action: ODRER_ACTIONS, id, payload: any): Promise<void> {
        switch(action) {
            case ODRER_ACTIONS.ADD:
                this.addOrderToUserCart(id)
        }
        return
    }

    addOrderToUserCart(id) {} 

    submitOrder(id) {}

    rejectOrder(id) {}

    resolveOrder(id) {}

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
        res.end(JSON.stringify({error: err}));
    }

    getRouter(): Router {
        return this.orderRouter.get('/', this.getOrdersHandler.bind(this));
    }
}

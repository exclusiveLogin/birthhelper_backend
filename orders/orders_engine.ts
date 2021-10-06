
import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
import {Observable, throwError} from "rxjs";
import {generateFilterQStr} from "../db/sql.helper";
import {DataBaseService} from "../db/sql";
import {Context} from "../search.engine/config";
import {tap} from "rxjs/operators";
import { ODRER_ACTIONS, Order } from "./orders.model";

export class OrderEngine {
    private orderRouter = express.Router();
    ce: CacheEngine;
    dbe: DataBaseService;

    constructor(context: Context) {
        context.orderEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }

    getOrdersByUser(id: string, limit = '200', skip = '0'): Observable<any[]> {

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

    getOrdersBySession(id: string): Observable<any[]> {
        return 
    }

    getOrders(session_id: string): Observable<Order[]> {
        return
    }

    
    isAuthUser(): boolean {
        return
    }

    actionToOrder(action: ODRER_ACTIONS, id, payload: any): Observable<void> {
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

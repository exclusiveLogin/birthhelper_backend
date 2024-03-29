import * as express from "express";
import uuid = require('uuid');
import { CacheEngine } from "../cache.engine/cache_engine";
import {
    Response,
    Request,
    Router } from "express";
import { DataBaseService } from "../db/sql";
import { Context } from "../search/config";
import {
    ODRER_ACTIONS,
    Order, OrderContacts, OrderGroup,
    OrderPayload, OrderSrc,
    STATUSES,
    StatusType
} from "./orders.model";
import { EntityKeys } from "../entity/entity_repo.model";
import { OkPacket } from "mysql";
import { FilterParams } from "../entity/entity_engine";
import { generateQStr } from "../db/sql.helper";
import {map, switchMap} from "rxjs/operators";
import {User, UserSrc} from "../models/user.interface";
const bodyParser = require('body-parser');
const jsonparser = bodyParser.json();

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
        const fetchFromDB = (): Promise<Order[]> => {
            const q =
                `SELECT * 
                FROM \`orders\` 
                WHERE user_id = ${uid} 
                AND \`status\` != "deleted"`;

            return this.dbe.queryList<OrderSrc>(q)
                .pipe(
                    map(list => list.map(src => Order.createOrderFromSrc(src))))
                .toPromise();
        };

        return fetchFromDB();
    }

    async getOrdersBySession(sid: number): Promise<Order[]> {
        const fetchFromDB = (): Promise<Order[]> => {
            const q =
                `SELECT * 
                FROM \`orders\` 
                WHERE session_id = ${sid}
                AND \`status\` != "deleted"
                AND \`user_id\` = 3`;

            return this.dbe.queryList<OrderSrc>(q)
                .pipe(
                    map(list => list.map(src => Order.createOrderFromSrc(src))))
                .toPromise();
        };

        return fetchFromDB();

    }

    async getOrdersMany(filters: FilterParams) {
        const likeStr = [
            ...generateQStr('ent_orders', filters, 'string'),
            ...generateQStr('ent_orders', filters, 'flag')].join(' AND ');
        const whereStr = [
            ...generateQStr('ent_orders', filters, 'id')].join(' AND ');
        const q =
            `SELECT * 
                FROM \`orders\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} `;

        return this.dbe.queryList<OrderSrc>(q)
            .pipe(
                map(list => list.map(src => Order.createOrderFromSrc(src))))
            .toPromise();
    }

    async getGroupedOrders(payload: OrderPayload): Promise<OrderGroup[]> {
        const result: OrderGroup[] = [];
        const skip = Number(payload?.skip ?? '0');
        const limit = Number(payload?.limit ?? '20');
        const limStr = `${!!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip : ' LIMIT ' + limit}`;
        // status str generation
        let statusStr = payload.status ? ` (status = ${payload.status}) ` : ` (1) `;
        if (payload.status === 'inwork') statusStr = ` (status = "waiting" OR status = "rejected" OR status = "resolved") `;
        if (payload.status === 'incomplete') statusStr = ` (status = "completed" OR status = "progressing" OR status = "canceled") `;
        if (payload.status === 'inplan') statusStr = ` (status = "pending") `;

        let q: string;
        switch (payload.groupMode) {
            case "session":
                q = `SELECT \`session_id\` as \`id\` 
                     FROM \`orders\` 
                     WHERE \`contragent_entity_id\`="${payload.contragent_entity_id}"
                     AND ${statusStr}
                     GROUP BY \`session_id\`
                     ${limStr}`;
                break;
            case "order":
                q = `SELECT \`group_token\` as \`id\` 
                     FROM \`orders\` 
                     WHERE \`group_token\` IS NOT NULL
                     AND \`contragent_entity_id\`="${payload.contragent_entity_id}"
                     AND ${statusStr}
                     GROUP BY \`group_token\`
                     ${limStr}`;
                break;
        }
        try {
            const uids = await this.dbe.queryList<{id: number | string }>(q)
                .pipe(map(list => list.map(src =>  src.id))).toPromise();

            for(const groupId of uids) {
                const grp: OrderGroup = {
                    group_id: groupId.toString(),
                    groupMode: payload.groupMode,
                    orders: null,
                    user: null,
                    contacts: null,
                };

                result.push(grp);

                switch (payload.groupMode) {
                    case "session":
                        q = `SELECT * FROM \`orders\`
                             WHERE \`session_id\` = ${ groupId } 
                             AND ${statusStr};`;
                        break;
                    case "order":
                        q = `SELECT * FROM \`orders\` 
                             WHERE \`group_token\` = "${ groupId }"
                             AND ${statusStr};`;
                        break;
                }

                grp.orders = await this.dbe.queryList<OrderSrc>(q).pipe(
                    map(list => list.map(src => Order.createOrderFromSrc(src)))
                ).toPromise();

                const userId = grp?.orders?.[0]?.user_id;

                grp.user = await this.ctx.entityEngine.getEntitiesByIds([userId], 'ent_users')
                    .pipe(
                        map(list => list?.[0]),
                        map(src => new User(src as UserSrc)),
                    ).toPromise();

                q = `SELECT * FROM \`order_contacts\` WHERE \`group_token\` = "${ groupId }";`;

                grp.contacts = payload.groupMode === 'order'
                    ? await this.dbe.query<OrderContacts>(q).pipe(
                        map(list => list[0])).toPromise()
                    : null;
            }
        } catch (e) {
            throw e;
        }

        return result;
    }

    async getTotalOfGroupedOrders(payload: OrderPayload): Promise<number> {
        // status str generation
        let statusStr = payload.status ? ` (status = ${payload.status}) ` : ` (1) `;
        if (payload.status === 'inwork') statusStr = ` (status = "waiting" OR status = "rejected" OR status = "resolved") `;
        if (payload.status === 'incomplete') statusStr = ` (status = "completed" OR status = "progressing" OR status = "canceled") `;
        if (payload.status === 'inplan') statusStr = ` (status = "pending") `;

        let q: string;
        switch (payload.groupMode) {
            case "session":
                q = `SELECT COUNT(*) as \`total\` 
                     FROM (
                         SELECT \`session_id\` FROM \`orders\` 
                         WHERE \`contragent_entity_id\`="${payload.contragent_entity_id}"
                         AND ${statusStr}
                         GROUP BY \`session_id\`
                     ) AS t`;
                break;
            case "order":
                q = `SELECT COUNT(*) as \`total\` 
                     FROM (
                        SELECT \`group_token\` FROM \`orders\`
                        WHERE \`group_token\` IS NOT NULL
                         AND \`contragent_entity_id\`="${payload.contragent_entity_id}"
                         AND ${statusStr}
                         GROUP BY \`group_token\`
                     ) AS t`;
                break;
        }
        try {
            const  [{ total }] = await this.dbe.queryList<{total: number}>(q).toPromise();
            return total;
        } catch (e) {
            throw e;
        }
    }

    async getTotalOfOrdersByUser(uid: number): Promise<number> {
        const q =
            `SELECT COUNT(*) as total 
            FROM \`orders\` 
            WHERE user_id = ${uid} 
            AND \`status\` != "deleted"`;

        const [{total}] = await this.dbe.queryList<{total: number}>(q).toPromise();
        return total;
    }

    async getTotalOfOrdersBySession(sid: number): Promise<number> {
        const q =
            `SELECT COUNT(*) as total 
            FROM \`orders\` 
            WHERE session_id = ${sid}
            AND \`status\` != "deleted"
            AND \`user_id\` = 3`;

        const [{total}] = await this.dbe.queryList<{total: number}>(q).toPromise();
        return total;
    }

    async getTotalOfOrdersMany(filters: FilterParams): Promise<number> {
        const likeStr = [
            ...generateQStr('ent_orders', filters, 'string'),
            ...generateQStr('ent_orders', filters, 'flag')].join(' AND ');
        const whereStr = [
            ...generateQStr('ent_orders', filters, 'id')].join(' AND ');
        const q =
            `SELECT COUNT(*) as total 
                FROM \`orders\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} `;

        const [{total}] = await this.dbe.queryList<{total: number}>(q).toPromise();
        return total;
    }

    async getOrders(token: string, payload?: OrderPayload): Promise<(Order | OrderGroup)[]> {
        const uid = await this.getUserIDBySession(token);
        const authMode = await this.userISAuthorized(uid);
        const session = await this.getSessionByToken(token);
        if (payload) {
            return payload.groupMode ?
                this.getGroupedOrders(payload) :
                this.getOrdersMany(payload.filters ?? {});
        }

        return authMode
            ? this.getOrdersByUser(uid)
            : this.getOrdersBySession(session);
    }

    async getTotalOfOrders(token: string, payload?: OrderPayload): Promise<(number)> {
        const uid = await this.getUserIDBySession(token);
        const authMode = await this.userISAuthorized(uid);
        const session = await this.getSessionByToken(token);
        if (payload) {
            return payload.groupMode ?
                this.getTotalOfGroupedOrders(payload) :
                this.getTotalOfOrdersMany(payload.filters ?? {});
        }

        return authMode
            ? this.getTotalOfOrdersByUser(uid)
            : this.getTotalOfOrdersBySession(session);
    }

    async clearOrders(token: string): Promise<OkPacket> {
        const user = await this.getUserIDBySession(token);
        const session = await this.getSessionByToken(token);
        const authMode = await this.userISAuthorized(user);

        const q_session = `UPDATE \`orders\` 
                    SET \`status\`=\"deleted\"
                    WHERE \`session_id\` = ${session}`;

        const q_user = `UPDATE \`orders\` 
                    SET \`status\`=\"deleted\"
                    WHERE \`user_id\` = ${user}`;

        return authMode
            ? this.ctx.dbe.query<OkPacket>(q_user).toPromise()
            : this.ctx.dbe.query<OkPacket>(q_session).toPromise();
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

    async actionToOrder(token: string, action: ODRER_ACTIONS, payload: OrderPayload): Promise<OkPacket | (Order | OrderGroup)[]> {
        const {
            id,
            ent_id,
            ent_key,
        } = payload;

        switch (action) {
            case ODRER_ACTIONS.GET:
                return this.getOrders(token, payload);
            case ODRER_ACTIONS.ADD:
                return this.addOrderToUserCart(token, payload);
            case ODRER_ACTIONS.CLEAR:
                return this.clearOrders(token);
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
                return this.submitGroupOrdersBySessionID(token, payload);

            case ODRER_ACTIONS.SENDBYORG:
                return id
                    ? this.changeStatusOrderById(id, STATUSES.progressing)
                    : this.changeStatusOrderByPair(token, ent_key, ent_id, STATUSES.progressing);
            default:
                return Promise.reject('Action is unknown');
        }
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
            const total = await this.getTotalOfOrders(token, payload);
            const result = await this.actionToOrder(token, action, payload);
            res.send(JSON.stringify({ context: 'orders', result, total }));
        } catch (e) {
            res.status(500);
            res.send({ error: e });
        }

    }

    async addOrderToUserCart(token: string, payload: OrderPayload): Promise<OkPacket> {
        const {
            ent_id,
            ent_key,
            tab_key,
            floor_key,
            section_key,
            contragent_entity_id,
            status,
            group_token,
            utility,
        } = payload;
        const user_id = await this.getUserIDBySession(token);
        const session_id = await this.getSessionByToken(token);
        const q = ` INSERT INTO \`orders\` 
                    (
                        \`user_id\`, 
                        \`session_id\`, 
                        \`slot_entity_id\`, 
                        \`slot_entity_key\`, 
                        \`refferer\`, 
                        \`status\`,
                        \`tab_key\`,
                        \`floor_key\`,
                        \`section_key\`,
                        \`contragent_entity_id\`,
                        \`group_token\`,
                        \`utility\`
                    )
                    VALUES (
                        ${user_id}, 
                        ${session_id}, 
                        ${ent_id}, 
                        "${ent_key}", 
                        ${user_id}, 
                        "${status ?? 'pending'}",
                        "${tab_key}",
                        "${floor_key}",
                        "${section_key}",
                        "${contragent_entity_id}",
                        ${group_token ? `"${group_token}"` : null},
                        ${utility ? `"${utility}"` : `"other"`}
                    )`;
        return this.ctx.dbe.query<OkPacket>(q).toPromise();
    }

    changeStatusOrderById(id: number, newStatus: StatusType): Promise<OkPacket> {
        const q = `UPDATE \`orders\` SET \`status\`= \"${newStatus}\" WHERE \`id\`=${id}`;
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
        const authMode = await this.userISAuthorized(user);

        const q_session = `UPDATE \`orders\` 
                    SET \`status\`= \"${newStatus}\"
                    WHERE \`slot_entity_key\`= "${ent_key}"
                    AND \`slot_entity_id\`= ${ent_id}
                    AND \`session_id\` = ${session}`;

        const q_user = `UPDATE \`orders\` 
                    SET \`status\`= \"${newStatus}\"
                    WHERE \`slot_entity_key\`= "${ent_key}"
                    AND \`slot_entity_id\`= ${ent_id}
                    AND \`user_id\` = ${user}`;

        return authMode
            ? this.ctx.dbe.query<OkPacket>(q_user).toPromise()
            : this.ctx.dbe.query<OkPacket>(q_session).toPromise();
    }

    async submitGroupOrdersBySessionID(token: string, payload: OrderPayload): Promise<OkPacket> {
        const groupToken: string = uuid.v4();
        const userId = await this.getUserIDBySession(token);
        const sessionId = await this.getSessionByToken(token);
        const contacts = payload.contacts;
        if(!sessionId) throw new Error('session not found');
        if(!contacts) throw new Error('contacts not found');
        const authMode = await this.userISAuthorized(userId);

        const q = !authMode

            ? `UPDATE \`orders\` 
            SET \`status\`= \"waiting\",
            \`group_token\`= \"${groupToken}\"
            WHERE \`session_id\` = ${sessionId}
            AND \`status\`= \"pending\"`

            : `UPDATE \`orders\` 
            SET \`status\`= \"waiting",
            \`group_token\`= \"${groupToken}\"
            WHERE \`user_id\` = ${userId}
            AND \`status\`= \"pending\"`;

        const qc = `INSERT INTO \`order_contacts\` 
                    SET \`group_token\`= \"${groupToken}\",
                    \`user_id\`= ${userId},
                    \`session_id\`= \"${sessionId}\",
                    \`phone\`= ${contacts.phone ? '"'+contacts.phone+'"' : null},
                    \`email\`= ${contacts.email ? '"'+contacts.email+'"' : null},
                    \`skype\`= ${contacts.skype ? '"'+contacts.skype+'"' : null},
                    \`ch_phone\`= ${contacts.ch_phone ? 1 : 0},
                    \`ch_email\`= ${contacts.ch_email ? 1 : 0},
                    \`ch_skype\`= ${contacts.ch_skype ? 1 : 0},
                    \`ch_viber\`= ${contacts.ch_viber ? 1 : 0},
                    \`ch_whatsapp\`= ${contacts.ch_whatsapp ? 1 : 0},
                    \`ch_telegram\`= ${contacts.ch_telegram ? 1 : 0}
                    `;
        return this.ctx.dbe.query<OkPacket>(q).pipe(
            switchMap(_ => this.ctx.dbe.query<OkPacket>(qc))).toPromise();
    }

    async getOrdersHandler(req: Request, res: Response): Promise<void> {
        const token = await this.ctx.authorizationEngine.getToken(req);
        if (!token) {
            res.status(500);
            res.send({ error: 'Token not recieved' });
        }

        try {
            const total = await this.getTotalOfOrders(token);
            const result = await this.getOrders(token);
            res.send(JSON.stringify({ context: 'orders', result, total }));
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

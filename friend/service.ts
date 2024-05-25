import {Context} from "../search/config";
import * as express from "express";
import {Response, Router} from "express";
import {
    Banned,
    BannedModel,
    EditFriendRequest,
    Friend,
    FriendModel,
    FriendsRequestDTO,
    FriendStatus
} from "./models";
import { escape } from "mysql";
import {userCatcher, } from "../common/user-catcher";
import {EntityKeys} from "../entity/entity_repo.model";
import {json} from "body-parser";

export class FriendEngine {
    private router = express.Router();

    sendError(res: Response, err, code?: number)  {
        console.log(
            "FRIEND SERVICE error: ",
            (err.message ? err.message : err) ?? "unknown error"
        );
        if (res.statusCode === 200) {
            res.status(code ?? 500);
        }

        res.end(
            JSON.stringify({
                success: false,
                error:
                    res.statusMessage ??
                    (err.message ? err.message : err) ??
                    "unknown error",
            })
        );
    }

    async checkOwnership(id: number, userId: number) {
        const record = await this.#getFriendRecordById(id).then(result => result?.[0]);
        if(!record) throw 'Record is not exist';

        const valid = record.user_id === userId || (record.target_key === 'ent_users' && record.target_id === userId);
        if (!valid) throw 'You not owner by record.user_id';
        return null;
    }

    #getFriendRecordById(id: number, status?: FriendStatus, page = 1): Promise<FriendModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;
        const q =
            `SELECT * FROM \`friend_list\`
            WHERE id=${escape(id)}
            ${status ? ` AND status = ${escape(status)}` : ""}
            AND datetime_delete IS NULL
            LIMIT ${limit}
            OFFSET ${offset}`;

        console.log(' getFriendRecordById q: ', q);

        return this.ctx.dbe.queryList<FriendModel>(q).toPromise();
    }

    #getFriendsByUserId(userId: number, status: FriendStatus = 'approved', self = true,  page = 1): Promise<FriendModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;
        const target = status === 'pending' ?
        self ? `user_id=${escape(userId)} ` : `target_key="ent_users" AND target_id=${escape(userId)}`
            : `user_id=${escape(userId)} 
               OR (target_key="ent_users" AND target_id=${escape(userId)})`;
        const q =
            `SELECT * FROM \`friend_list\`
            WHERE ( ${target} ) 
            AND status=${escape(status)}
            AND datetime_delete IS NULL
            LIMIT ${limit}
            OFFSET ${offset}`;

        console.log(' getFriendsByUserId q: ', q);

        return this.ctx.dbe.queryList<FriendModel>(q).toPromise();
    }

    async #addFriend(userId: number, friendId: number, friendType: EntityKeys = 'ent_users') {

        const _ = await this.#getFriendsByUserId(friendId);
        const exist = Boolean(_?.length);
        if(exist) throw 'Friend record is exist';

        const q = `INSERT INTO \`friend_list\` 
                        (user_id, target_key, target_id) 
                        VALUES (${escape(userId)}, ${escape(friendType)}, ${escape(friendId)})`;

        return this.ctx.dbe.query(q).toPromise();
    }

    async #editFriendRecord(id: number, newstatus: FriendStatus) {
        const exist = Boolean(await this.#getFriendRecordById(id));
        if(!exist) throw 'Friend record is not exist';

        const q = `UPDATE \`friend_list\` SET status = ${escape(newstatus)} WHERE id = ${escape(id)}`;
        return this.ctx.dbe.query(q).toPromise();
    }

    async #deleteFriendRecord(id: number) {
        const exist = Boolean(await this.#getFriendRecordById(id));
        if(!exist) throw 'Friend record is not exist';

        const q = `UPDATE \`friend_list\` SET datetime_delete = NOW() WHERE id = ${escape(id)}`;
        console.log('deleteFriendRecord q:', q);
        return this.ctx.dbe.query(q).toPromise();
    }

    #getOffers(userId: number, self = true,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId, 'pending', self, page);
    }

    #getActives(userId: number,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId, 'approved', null, page);
    }

    #getBlocked(userId: number,  page = 1): Promise<BannedModel[]> {
        return this.#getFriendRecordById(userId, 'blocked', page) as Promise<BannedModel[]>;
    }

    async getFriendsHandler(req: express.Request, res: express.Response) {
        try {
            const selfFriendsMode = !req.params?.['id'];
            const userId = parseInt(req.params['id'] ?? res.locals.userId);
            const pageNumber = parseInt(req.query['page'] as string) || 1;

            const dto: FriendsRequestDTO = {
                active: await this.#getActives(userId,pageNumber)
                    .then((list) => Promise.all(list.map(item => new Friend(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())),
                banned: selfFriendsMode ?
                    await this.#getBlocked(userId,pageNumber)
                    .then((list) => Promise.all(list.map(item => new Banned(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())) : null,
                offered: selfFriendsMode ? await this.#getOffers(userId, false, pageNumber)
                    .then((list) => Promise.all(list.map(item => new Friend(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())) : null,
                pending: selfFriendsMode ? await this.#getOffers(userId, true, pageNumber)
                    .then((list) => Promise.all(list.map(item => new Friend(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())) : null,
            };

            res.send(dto);
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    async createFriendHandler(req: express.Request, res: express.Response) {
        try {
            const userId = parseInt(res.locals.userId);
            const friend_id = parseInt(req.body['friend_id']);

            const result = await this.#addFriend(userId, friend_id);
            res.send({success: true, result });
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    async editFriendHandler(req: express.Request, res: express.Response) {
        try {
            const userId = parseInt(res.locals.userId);
            const friendRecordId = parseInt(req.params['id']);
            const {status} = req.body as EditFriendRequest;

            if(!status) throw 'new status is required';

            await this.checkOwnership(friendRecordId, userId);
            const result = await this.#editFriendRecord(friendRecordId, status);


            res.send({success: true, result });
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    async deleteFriendHandler(req: express.Request, res: express.Response) {
        try {
            const userId = parseInt(res.locals.userId);
            const friendRecordId = parseInt(req.params['id']);

            await this.checkOwnership(friendRecordId, userId);
            const result = await this.#deleteFriendRecord(friendRecordId);


            res.send({success: true, result });
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    constructor(private ctx: Context) {
        ctx.friendEngine = this;
        this.router.use(userCatcher.bind(this, this.ctx));
        this.router.use(json())
        // запрос друзей для текущего пользака
        this.router.get('/', this.getFriendsHandler.bind(this));

        // запрос друзей для userID
        this.router.get('/:id', this.getFriendsHandler.bind(this));

        // создание заявки...
        this.router.post('/', this.createFriendHandler.bind(this));

        // Изменение статуса заявки
        this.router.patch('/:id', this.editFriendHandler.bind(this));

        // Удаление заявки или друга
        this.router.delete('/:id', this.deleteFriendHandler.bind(this));

        // Добавление юзера в блеклист
        this.router.post('/block/:id');

        // Удаление юзера из блеклиста
        this.router.delete('/block/:id');
    }

    getRouter(): Router{
        return this.router;
    }
}
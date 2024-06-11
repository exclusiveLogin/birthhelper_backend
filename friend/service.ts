import {Context} from "../search/config";
import * as express from "express";
import {Response, Router} from "express";
import {
    Banned,
    BannedModel,
    EditFriendRequest,
    Friend,
    FriendModel,
    FriendsRequestDTO, FriendStateDTO,
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
        const record = await this.#getFriendRecordListById(id).then(result => result?.[0]);
        if(!record) throw 'Record is not exist';

        const valid = record.user_id === userId || (record.target_key === 'ent_users' && record.target_id === userId);
        if (!valid) throw 'You not owner by record.user_id';
        return null;
    }

    async checkBlackListRecordOwnership(id: number, userId: number) {
        const record = await this.#getBlackRecordById(id).then(result => result?.[0]);
        if(!record) throw 'Record is not exist';

        const valid = record.user_id === userId;
        if (!valid) throw 'You not owner by black list record';
        return null;
    }

    async #checkIsFriend(userId: number, targetId: number): Promise<boolean> {
        const list = await Promise.all([
            this.#getFriendRecordByUserIdAndTargetId(userId, targetId),
            this.#getFriendRecordByUserIdAndTargetId(targetId, userId),
        ]);
        const list_1 = list.flat();
        const list_2 = list_1.filter(record => record.status === 'approved');
        return Boolean(list_2.length);
    }

    async #checkIsOffered(userId: number, targetId: number): Promise<boolean> {
        const list = await Promise.all([
            this.#getFriendRecordByUserIdAndTargetId(userId, targetId),
        ]);
        const list_1 = list.flat();
        const list_2 = list_1.filter(record => record.status === 'pending');
        return Boolean(list_2.length);
    }

    async #checkCanFriendOffer(userId: number, targetId: number): Promise<boolean> {
        const [b1, b2, isFriend] = await Promise.all(
            [
                this.#getBlackRecordsById(userId, targetId),
                this.#getBlackRecordsById(targetId, userId),
                this.#checkIsFriend(userId, targetId)
            ]);
        const {blackRecords, isFriend: isFriend_1} = ({blackRecords: Array.of(...b1, ...b2), isFriend});
        return !(blackRecords?.length || isFriend_1);
    }

    async #checkIsBanned(userId: number, targetId: number): Promise<boolean> {
        const result = await this.#getBlackRecordsById(userId, targetId);
        return Boolean(result.length);
    }

    async #checkYourIsBanned(userId: number, targetId: number): Promise<boolean> {
        const result = await this.#getBlackRecordsById(targetId, userId);
        return Boolean(result.length);
    }

    async #getFriendRecordByUserIdAndTargetId(userId: number, targetId: number) {
        const q1 =
            `SELECT * FROM \`friend_list\`
                WHERE ( user_id=${escape(userId)}
                AND (target_key="ent_users" AND target_id=${escape(targetId)}) )
                AND datetime_delete IS NULL`;

        return this.ctx.dbe.queryList<FriendModel>(q1).toPromise();
    }

    async #getBlackRecordsById(userId: number, targetId: number) {
        const q =
            `SELECT * FROM \`black_list\`
                WHERE ( user_id=${escape(userId)}
                AND (target_key="ent_users" AND target_id=${escape(targetId)}) )
                AND datetime_delete IS NULL`;

        return this.ctx.dbe.queryList<BannedModel>(q).toPromise();
    }

    async #getFriendRecordListById(id: number, status?: FriendStatus, page = 1): Promise<FriendModel[]> {
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

    async #getFriendsByUserId(userId: number, status: FriendStatus = 'approved', self = true,  page = 1): Promise<FriendModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;

        const target = status === 'pending' ?
            self ? `user_id=${escape(userId)} ` : `target_key="ent_users" 
                    AND target_id=${escape(userId)}`
                :   `user_id=${escape(userId)} 
                    OR (target_key="ent_users" 
                    AND target_id=${escape(userId)})`;
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
        const _ = await this.#getFriendRecordListById(id);
        const exist = Boolean(_?.length);
        if(!exist) throw 'Friend record is not exist';

        const q = `UPDATE \`friend_list\` SET status = ${escape(newstatus)} WHERE id = ${escape(id)}`;
        return this.ctx.dbe.query(q).toPromise();
    }

    async #deleteFriendRecord(id: number) {
        const q = `UPDATE \`friend_list\` SET datetime_delete = NOW() WHERE id = ${escape(id)}`;
        console.log('deleteFriendRecord q:', q);
        return this.ctx.dbe.query(q).toPromise();
    }

    async #deleteBlockRecord(id: number) {
        const q = `UPDATE \`black_list\` SET datetime_delete = NOW() WHERE id = ${escape(id)}`;
        console.log('deleteFriendBlackRecord q:', q);
        return this.ctx.dbe.query(q).toPromise();
    }

    async #getBlackRecordById(id: number): Promise<BannedModel> {
        const q =
            `SELECT * FROM \`black_list\`
            WHERE id=${escape(id)}
            AND datetime_delete IS NULL`;

        console.log(' getFriendRecordById q: ', q);

        return this.ctx.dbe.queryOnceOfList<BannedModel>(q).toPromise();
    }

    async #getBlackListByUser(userId: number, page = 1): Promise<BannedModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;

        const q =
            `SELECT * FROM \`black_list\`
            WHERE user_id=${escape(userId)}
            AND datetime_delete IS NULL
            LIMIT ${limit}
            OFFSET ${offset}`;

        console.log('getBlackListRecordByUser q: ', q);

        return this.ctx.dbe.queryList<BannedModel>(q).toPromise();
    }

    async #blockRecord(blackUserId: number, userId: number) {
        // check user is friend
        const records = await this.#getFriendRecordListById(blackUserId)
        const exist = Boolean(records?.length);
        if(exist) throw 'Friend record is not exist';


        // check user is not in black list
        const black_records = await this.#getBlackListByUser(blackUserId) // rebuild
        const black_exist = Boolean(black_records?.length);
        if(black_exist) throw 'Friend record is not exist';

        const friendType = 'ent_users';

        const q = `INSERT INTO \`black_list\` 
                        (user_id, target_key, target_id) 
                        VALUES (${escape(userId)}, ${escape(friendType)}, ${escape(blackUserId)})`;

        return this.ctx.dbe.query(q).toPromise();
    }

    async #getOffers(userId: number, self = true,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId, 'pending', self, page);
    }

    async #getActives(userId: number,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId, 'approved', null, page);
    }

    async #getBlocked(userId: number,  page = 1): Promise<BannedModel[]> {
        return this.#getFriendRecordListById(userId, 'blocked', page) as Promise<BannedModel[]>;
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

    async getFriendStateHandler(req: express.Request, res: express.Response) {
        try {
            const userId = parseInt(res.locals.userId);
            const friendId = parseInt(req.params['id']);

            if(isNaN(friendId)) throw 'user ID is not valid';

            const dto: FriendStateDTO = {
                isFriend: await this.#checkIsFriend(userId, friendId),
                canFriendOffer: await this.#checkCanFriendOffer(userId, friendId),
                isBlocked: await this.#checkIsBanned(userId, friendId),
                isYourBanned: await this.#checkYourIsBanned(userId, friendId),
                isOffered: await this.#checkIsOffered(userId, friendId),
            }

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

    /**
     *
     * @param req
     * @param res
     */
    async getBlackListHandler(req: express.Request, res: express.Response) {
        try {
            const selfFriendsMode = !(req.params?.['id']);
            const userId = parseInt(!selfFriendsMode ? req.params['id'] : res.locals.userId);

            if (!userId) throw 'UserID is not valid';
            const pageNumber = parseInt(req.query['page'] as string) || 1;

            const result = await this.#getBlackListByUser(userId, pageNumber);
            res.send(result);
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    async postBlackRecordHandler(req: express.Request, res: express.Response) {
        try {
            const id = parseInt(req.params['id']);
            const userId = parseInt(res.locals.userId);

            if(id === userId) throw 'User cant self blocked';

            await this.#blockRecord(id, userId);

            res.send({success: true, id, userId});
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    async deleteBlackRecordHandler(req: express.Request, res: express.Response) {
        try {
            const id = parseInt(req.params['id']);
            const userId = parseInt(res.locals.userId);

            await this.checkBlackListRecordOwnership(id, userId);
            await this.#deleteBlockRecord(id);

            res.send({success: true, id, userId});
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    constructor(private ctx: Context) {
        ctx.friendEngine = this;
        this.router.use(userCatcher.bind(this, this.ctx));
        this.router.use(this.ctx.authorizationEngine.checkAccess.bind(ctx.authorizationEngine, 3))
        this.router.use(json())

        // Получить блеклист юзера
        this.router.get('/block', this.getBlackListHandler.bind(this));

        // Получить блеклист юзера
        this.router.get('/block/:id', this.getBlackListHandler.bind(this));

        // Добавление юзера в блеклист
        this.router.post('/block/:id', this.postBlackRecordHandler.bind(this));

        // Удаление юзера из блеклиста
        this.router.delete('/block/:id', this.deleteBlackRecordHandler.bind(this));

        // проверка Польака на статус дружбы
        this.router.get('/check/:id', this.getFriendStateHandler.bind(this));

        // Изменение статуса заявки
        this.router.patch('/:id', this.editFriendHandler.bind(this));

        // Удаление заявки или друга
        this.router.delete('/:id', this.deleteFriendHandler.bind(this));

        // получение друзей
        this.router.get('/', this.getFriendsHandler.bind(this));

        // запрос друзей для userID
        this.router.get('/:id', this.getFriendsHandler.bind(this));

        // создание заявки в друзья
        this.router.post('/', this.createFriendHandler.bind(this));
    }

    getRouter(): Router{
        return this.router;
    }
}
import {Context} from "../search/config";
import * as express from "express";
import {Response, Router} from "express";
import {Banned, BannedModel, BlockedStatus, Friend, FriendModel, FriendsRequestDTO, FriendStatus} from "./models";
import { escape } from "mysql";
import {userCatcher, } from "../common/user-catcher";

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
                error:
                    res.statusMessage ??
                    (err.message ? err.message : err) ??
                    "unknown error",
            })
        );
    }

    #getFriendsByUserId(userId: number, status: FriendStatus = 'approved',  page = 1): Promise<FriendModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;
        const q =
            `SELECT * FROM \`friend_list\`
            WHERE (
                user_id=${escape(userId)} 
                OR (target_key="ent_users" AND target_id=${escape(userId)})
                ) 
            AND status=${escape(status)}
            AND datetime_delete IS NULL
            LIMIT ${limit}
            OFFSET ${offset}`;

        console.log(' getFriendsByUserId q: ', q);

        return this.ctx.dbe.queryList<FriendModel>(q).toPromise();
    }

    async #getBlockedByUserId(userId: number, status: BlockedStatus = 'blocked', page = 1): Promise<BannedModel[]> {
        const offset = page > 1 ? page * 20 : 0;
        const limit = 20;
        const q =
            `SELECT *  FROM \`black_list\` 
            WHERE user_id=${escape(userId)}
            AND status=${escape(status)}
            AND datetime_delete IS NULL
            LIMIT ${limit}
            OFFSET ${offset}`;

        console.log(' getBlockedByUserId q: ', q);

        return this.ctx.dbe.queryList<BannedModel>(q).toPromise();
    }

    async getFriendsHandler(req: express.Request, res: express.Response) {
        try {
            const userId = parseInt(res.locals.userId);
            const pageNumber = parseInt(req.params.page);

            const dto: FriendsRequestDTO = {
                active: await this.#getActives(userId,pageNumber)
                    .then((list) => Promise.all(list.map(item => new Friend(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())),
                banned: await this.#getBlocked(userId,pageNumber)
                    .then((list) => Promise.all(list.map(item => new Banned(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())),
                offered: await this.#getOffers(userId,pageNumber)
                    .then((list) => Promise.all(list.map(item => new Friend(item, this.ctx).ready())))
                    .then(list => list.map(item => item.getSnapshot())),
            };

            res.send(dto);
        } catch (e) {
            this.sendError(res, e.message || e);
        }
    }

    #getOffers(userId: number,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId, 'offered');
    }

    #getActives(userId: number,  page = 1): Promise<FriendModel[]> {
        return this.#getFriendsByUserId(userId);
    }

    #getBlocked(userId: number,  page = 1): Promise<BannedModel[]> {
        return this.#getBlockedByUserId(userId);
    }

    constructor(private ctx: Context) {
        ctx.friendEngine = this;
        this.router.use(userCatcher.bind(this, this.ctx));
        // запрос друзей для текущего пользака
        this.router.get('/', this.getFriendsHandler.bind(this));

        // запрос друзей для userID
        this.router.get('/:id');

        // создание заявки...
        this.router.post('/');

        // Изменение статуса заявки
        this.router.post('/:id');

        // Удаление заявки
        this.router.delete('/:id');

        // Добавление юзера в блеклист
        this.router.put('/block/:id');
    }



    getRouter(): Router{
        return this.router;
    }
}
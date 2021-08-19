import express = require('express');
import uuid = require('uuid');
import {IUser, UserRole, UserSession} from '../models/user.interface';
import bodyParser = require('body-parser');
import {Context} from "../search.engine/config";
import {map, mapTo} from "rxjs/operators";
import {OkPacket} from "mysql";
import {Request, Response} from "express";

const jsonparser = bodyParser.json();


export class AuthorizationEngine {

    auth = express.Router();

    async checkAccess(target = 1, req: Request, res: Response, next: Function) {
        try {
            const token = await this.getToken(req);
            const permitted: boolean = await this.hasPermissionByToken(token, target);
            if(!permitted) {
                this.sendNotPermitted(res);
                return;
            }
        } catch (e) {
            console.log('checkAccess error', e);
            this.sendNotPermitted(res, e);
            return;
        }
        next();
    }

    sendNotPermitted(response: Response, reason?: string) {
        response.status(403);
        response.send({auth: false, error: reason ? reason : 'Запрошенное действие не разрешено'});
    }

    constructor(private context: Context) {
        this.context.authorizationEngine = this;

        this.auth.get('/uuid', this.uuidHandler);

        this.auth.get('/role', this.roleHandler.bind(this));

        this.auth.get('/user', this.userHandler.bind(this));

        this.auth.delete('/', jsonparser, this.deleteHandler.bind(this));

        this.auth.patch('/', jsonparser, this.patchHandler.bind(this));

        this.auth.put('/', jsonparser, this.putHandler.bind(this));

        this.auth.post('/', jsonparser, this.postHandler.bind(this));
    }

    async getToken(req: Request): Promise<string> {
        const token = req.headers?.['token'] as string;
        if(!token) return Promise.reject('Токен не передан');
        return token;
    }

    async getUserById(id: number): Promise<IUser> {
        const q = `SELECT * FROM \`users\` WHERE \`id\` = ${id}`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as IUser)?.[0]),
        ).toPromise();
    }

    async getUserIdByToken(token: string): Promise<number> {
        const q = `SELECT * FROM \`sessions\` WHERE \`token\` = "${token}"`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as UserSession)?.[0]?.user_id),
        ).toPromise();
    }

    async getRoleByUserId(user_id: number): Promise<UserRole> {
        const q = `SELECT \`roles\`.*, \`users\`.\`id\` as user_id FROM users, roles WHERE users.id = ${user_id} AND users.role = roles.id`;
        return this.context.dbe.query<UserRole>(q).pipe(
            map((result: UserRole[]) => result[0] ? result[0] : null)).toPromise();
    }

    async hasPermissionByToken(token: string, target: number): Promise<boolean> {
        const role = await this.getRoleByToken(token);
        return (role.rank - target || 0) >= 0;
    }

    async getRoleByToken(token: string): Promise<UserRole> {
        const user = await this.getUserIdByToken(token);
        if (!user) return Promise.reject('Пользователь не найден');
        const role = await this.getRoleByUserId(user);
        if (!role) return Promise.reject('Роль не найдена');
        delete role['user_id'];

        return role;
    }

    async hasPermissionByUser(user_id: number, target: number): Promise<boolean> {
        const role = await this.getRoleByUserId(user_id);
        if (!role) return Promise.reject('Роль не найдена');

        return (target - role.rank) >= 0;
    }

    async getUserIdByCredential(login: string, password: string): Promise<number> {
        const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}" AND password = "${password}"`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as IUser)?.[0]?.id),
        ).toPromise();
    }

    async getGuestID(): Promise<number> {
        const q = `SELECT * FROM \`users\` WHERE \`login\` = "guest" AND password IS NULL`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as IUser)?.[0]?.id),
        ).toPromise();
    }

    async checkUserExist(login: string): Promise<boolean> {
        const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}"`;
        console.log('q: ', q);

        return this.context.dbe.query(q).pipe(
            map(result => !!(result as any as IUser)?.[0]?.id),
        ).toPromise();
    }

    async cleanOldTokens(userId: number): Promise<null> {
        const q = `DELETE FROM \`sessions\` WHERE \`user_id\` = ${userId}`;

        return this.context.dbe.query(q).pipe(
            mapTo(null)
        ).toPromise();
    }

    async cleanCurrentSession(token: string): Promise<null> {
        const q = `DELETE FROM \`sessions\` WHERE \`token\` = "${token}"`;

        return this.context.dbe.query(q).pipe(
            mapTo(null)
        ).toPromise();
    }

    async createNewSession(userId): Promise<string> {
        const token: string = uuid.v4();
        const q = `INSERT INTO \`sessions\` (\`token\`, \`user_id\`) VALUES("${token}",${userId})`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as OkPacket)?.insertId ? token : null),
        ).toPromise();
    }

    async createNewUser(userLogin: string, userPassword: string): Promise<number> {
        const q = `INSERT INTO \`users\` (\`login\`, \`password\`) VALUES("${userLogin}", "${userPassword}")`;

        return this.context.dbe.query(q).pipe(
            map(result => (result as any as OkPacket)?.insertId),
        ).toPromise();
    }

    async changePasswordForUser(userLogin: string, userPassword: string): Promise<null> {
        const q = `UPDATE \`users\` SET \`password\` = "${userPassword}" WHERE \`login\` = "${userLogin}"`;

        return this.context.dbe.query(q).pipe(
            mapTo(null)
        ).toPromise();
    }

    async uuidHandler(req, res) {
        res.send({uuid: uuid.v4()});
    }

    async roleHandler(req, res) {
        try {
            const token = await this.getToken(req);
            const role = await this.getRoleByToken(token);
            res.send(role);
            
        } catch (e) {
            this.sendNotPermitted(res, e);
        }
    }

    async userHandler(req, res) {
        try {
            const token = await this.getToken(req);
            const user_id = await this.getUserIdByToken(token);
            const user = await this.getUserById(user_id);
            delete user.password;
            res.send(user);
        } catch (e) {
            console.log('userHandler', e);
            this.sendNotPermitted(res, e);
        }
    }

    // выход из сессии
    async deleteHandler(req, res) {
        console.log('delete auth', req.headers);
        const token: string = req?.headers?.token as string;
        if (token) {
            await this.cleanCurrentSession(token);
            res.send(JSON.stringify({
                exit: true,
                msg: 'Сессия завершениа',
                token,
            }));
        } else {
            res.status(500);
            res.send(JSON.stringify({
                exit: false,
                error: 'Токен не передан',
            }));
        }
    }

    // смена пароля
    async patchHandler(req, res) {
        console.log('patch auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];
        if (userLogin && userPassword) {
            // получаем id юзера
            const userId = await this.getUserIdByCredential(userLogin, userPassword);
            if (userId) {
                await this.changePasswordForUser(userLogin, userPassword);
                await this.cleanOldTokens(userId);
                const token = await this.createNewSession(userId);
                res.send(JSON.stringify({
                    changePassword: true,
                    login: userLogin,
                    token,
                    id: userId,
                }))

            } else {
                res.status(500);

                res.send(JSON.stringify({
                    changePassword: false,
                    error: 'Не верные данные для смены пароля',
                    login: userLogin,
                }));
            }
        }
    }

    // регистрация ... новый юзверь
    async putHandler(req, res) {
        console.log('put auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];
        if (userLogin && userPassword) {
            // получаем id юзера
            const userExist = await this.checkUserExist(userLogin);
            if (!userExist) {
                const id = await this.createNewUser(userLogin, userPassword);
                const token = await this.createNewSession(id);
                res.send(JSON.stringify({
                    signup: true,
                    login: userLogin,
                    token,
                    id,
                }))

            } else {
                res.status(500);

                res.send(JSON.stringify({
                    signup: false,
                    error: 'Пользователь с таким логином уже существует',
                    login: userLogin,
                }));
            }
        } else {
            res.status(500);

            res.send(JSON.stringify({
                signup: false,
                error: 'Не переданы необходимые данные для регистрации',
            }));
        }
    }

    // авторизация ... создание сессии
    async postHandler(req, res) {
        console.log('post auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];

        const userId =  (userLogin && userPassword) ?
            await this.getUserIdByCredential(userLogin, userPassword) :
            await this.getGuestID();

        if (userId) {
            const token = await this.createNewSession(userId);
            res.send({
                auth: true,
                token,
                login: userLogin,
                id: userId,
            })
        } else {
            res.status(401);
            res.send(JSON.stringify({
                auth: false,
                login: userLogin,
                error: 'Логин и пароль не совпадают',
            }));
        }
    }

    getRouter() {
        return this.auth
    }
}

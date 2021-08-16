import express = require('express');
const pool = require('../db/sql');
import uuid = require('uuid');
import {IUser, UserRole} from '../models/user.interface';
import bodyParser = require('body-parser');
import {Context} from "../search.engine/config";
import {map} from "rxjs/operators";
const jsonparser = bodyParser.json();


export class AuthorizationEngine {

    auth = express.Router();

    constructor(private context: Context) {
        this.context.authorizationEngine = this;

        this.auth.get('/uuid', this.uuidHandler);

        this.auth.delete('/', jsonparser, this.deleteHandler);

        this.auth.patch('/', jsonparser, this.patchHandler);

        this.auth.put('/', jsonparser, this.putHandler);

        this.auth.post('/', jsonparser, this.postHandler);
    }

    getToken = (req: any): string => {
        return req?.headers?.['token'];
    }

    async getUserIdByToken(token: string): Promise<number>  {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM \`sessions\` WHERE \`token\` = "${token}"`;
            pool.query(q, (err, result: IUser) => {
                if(err){
                    reject(err);
                } else {
                    console.log('user id RAW: ', result);
                    resolve(result[0]?.user_id);
                }
            });
        })
    }

    async getRoleByUserId(user_id: number): Promise<UserRole> {
        const q = `SELECT * FROM \`roles\`, \`users\` as user_id WHERE users.id = ${user_id} AND users.role = roles.id`;
        return this.context.dbe.query<UserRole>(q).pipe(
            map((result: UserRole[]) => result[0] ? result[0] : null)).toPromise();
    }

    async hasPermissionByToken(token: string, target: number): Promise<boolean> {
        const user = await this.getUserIdByToken(token);
        if(!user) return Promise.reject('Пользователь не найден');
        const role = await this.getRoleByUserId(user);
        if(!role) return Promise.reject('Роль не найдена');

        return (target - role.rank) >= 0;
    }

    async hasPermissionByUser(user_id: number, target: number): Promise<boolean> {
        const role = await this.getRoleByUserId(user_id);
        if(!role) return Promise.reject('Роль не найдена');

        return (target - role.rank) >= 0;
    }

    async getUserIdByCredential(login: string, password: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}" AND password = "${password}"`;
            pool.query(q, (err, result: IUser) => {
                if(err){
                    reject(err);
                } else {
                    console.log('user id RAW: ', result);
                    resolve(result[0]?.id);
                }
            });
        })
    }

    async checkUserExist(login: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}"`;
            console.log('q: ', q);
            pool.query(q, (err, result: IUser) => {
                if(err){
                    reject(err);
                } else {
                    console.log('check user id RAW: ', result);
                    resolve(!!result[0]);
                }
            });
        })
    }

    async cleanOldTokens(userId: number): Promise<null> {
        return new Promise((resolve, reject) => {
            const q = `DELETE FROM \`sessions\` WHERE \`user_id\` = ${userId}`;
            pool.query(q, (err, result) => {
                if(err){
                    reject(err);
                } else {
                    console.log('clean RAW: ', result);
                    resolve(null);
                }
            });
        });
    }

    async cleanCurrentSession(token: string): Promise<null> {
        return new Promise((resolve, reject) => {
            const q = `DELETE FROM \`sessions\` WHERE \`token\` = "${token}"`;
            pool.query(q, (err, result) => {
                if(err){
                    reject(err);
                } else {
                    console.log('clean token RAW: ', result);
                    resolve(null);
                }
            });
        });
    }

    async createNewSession(userId): Promise<string> {
        return new Promise((resolve, reject) => {
            const token = uuid.v4();
            const q = `INSERT INTO \`sessions\` (\`token\`, \`user_id\`) VALUES("${token}",${userId})`;
            pool.query(q, (err, result) => {
                if(err){
                    reject(err);
                } else {
                    console.log('clean RAW: ', result);
                    resolve(token);
                }
            });
        });
    }

    async createNewUser(userLogin: string, userPassword: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const token = uuid.v4();
            const q = `INSERT INTO \`users\` (\`login\`, \`password\`) VALUES("${userLogin}", "${userPassword}")`;
            pool.query(q, (err, result) => {
                if(err){
                    reject(err);
                } else {
                    console.log('create user RAW: ', result);
                    resolve(result.insertId);
                }
            });
        });
    }

    async changePasswordForUser(userLogin: string, userPassword: string): Promise<null> {
        return new Promise((resolve, reject) => {
            const q = `UPDATE \`users\` SET \`password\` = "${userPassword}" WHERE \`login\` = "${userLogin}"`;
            pool.query(q, (err, result) => {
                if(err){
                    reject(err);
                } else {
                    console.log('change pass user RAW: ', result);
                    resolve(null);
                }
            });
        });
    }

    async uuidHandler(req, res) {
        res.send({uuid: uuid.v4()});
    }

    async deleteHandler(req, res) {
        console.log('delete auth', req.headers);
        const token: string = req?.headers?.token as string;
        if(token){
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

    async patchHandler(req, res) {
        console.log('patch auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];
        if(userLogin && userPassword){
            // получаем id юзера
            const userId= await this.getUserIdByCredential(userLogin, userPassword);
            if(userId) {
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

    async putHandler(req, res) {
        console.log('put auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];
        if(userLogin && userPassword){
            // получаем id юзера
            const userExist= await this.checkUserExist(userLogin);
            if(!userExist) {
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

    async postHandler(req, res) {
        console.log('post auth', req.body);
        const userLogin: string = req.body['login'];
        const userPassword: string = req.body['password'];
        if(userLogin && userPassword){
            // получаем id юзера
            const userId = await this.getUserIdByCredential(userLogin, userPassword);
            console.log('login', userLogin, ' id: ', userId);
            if(userId) {
                const token = await this.createNewSession(userId);
                res.send(JSON.stringify({
                    auth: true,
                    token,
                    login: userLogin,
                    id: userId,
                }))
            } else {
                res.status(401);
                res.send(JSON.stringify({
                    auth: false,
                    login: userLogin,
                }));
            }
        } else {
            res.status(500);

            res.send(JSON.stringify({
                auth: false,
                error: 'Не переданы необходимые данные для авторизации',
            }));
        }
    }

    getRouter() {
        return this.auth
    }
}

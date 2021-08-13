import express = require('express');
const pool = require('../db/sql');
import uuid = require('uuid');
import {IUser} from '../models/user.interface';
import bodyParser = require('body-parser');
const jsonparser = bodyParser.json();

exports.getToken = (req: any): string => {
    return req?.headers?.['token'];
}

exports.getUserIdByToken = (token: string): Promise<number> => {
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

const getUserIdByCredencial = (login: string, password: string): Promise<number> => {
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

const checkUserExist = (login: string): Promise<boolean> => {
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

const cleanOldTokens = (userId: number): Promise<null> => {
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

const cleanCurrentSession = (token: string): Promise<null> => {
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

const createNewSession = (userId): Promise<string> => {
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

const createNewUser = (userLogin: string, userPassword: string): Promise<number> => {
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

const changePasswordForUser = (userLogin: string, userPassword: string): Promise<null> => {
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

const auth = express.Router();
auth.get('/uuid', function (req, res) {
    res.send({uuid: uuid.v4()});
});

auth.delete('/', jsonparser, async function (req, res) {

    console.log('delete auth', req.headers);
    const token: string = req?.headers?.token as string;
    if(token){
        await cleanCurrentSession(token);
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
})

auth.patch('/', jsonparser, async function (req, res) {

    console.log('patch auth', req.body);
    const userLogin: string = req.body['login'];
    const userPassword: string = req.body['password'];
    if(userLogin && userPassword){
        // получаем id юзера
        const userId= await getUserIdByCredencial(userLogin, userPassword);
        if(userId) {
            await changePasswordForUser(userLogin, userPassword);
            await cleanOldTokens(userId);
            const token = await createNewSession(userId);
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
});

auth.put('/', jsonparser, async function (req, res) {

    console.log('put auth', req.body);
    const userLogin: string = req.body['login'];
    const userPassword: string = req.body['password'];
    if(userLogin && userPassword){
        // получаем id юзера
        const userExist= await checkUserExist(userLogin);
        if(!userExist) {
            const id = await createNewUser(userLogin, userPassword);
            const token = await createNewSession(id);
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
})

auth.post('/', jsonparser, async function (req, res) {

    console.log('post auth', req.body);
    const userLogin: string = req.body['login'];
    const userPassword: string = req.body['password'];
    if(userLogin && userPassword){
        // получаем id юзера
        const userId = await getUserIdByCredencial(userLogin, userPassword);
        console.log('login', userLogin, ' id: ', userId);
        if(userId) {
            const token = await createNewSession(userId);
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
});

exports.router = auth;

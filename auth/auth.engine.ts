import express = require("express");
import uuid = require("uuid");
import bodyParser = require("body-parser");
import { User, UserRole, UserSession, UserSrc } from "../models/user.interface";
import { Context } from "../search/config";
import { map, mapTo } from "rxjs/operators";
import { OkPacket } from "mysql";
import { Request, Response } from "express";
import { EntityKeys } from "../entity/entity_repo.model";

const jsonparser = bodyParser.json();

export type REQ_ACTION = "read" | "edit" | "delete" | "create";

export class AuthorizationEngine {
  auth = express.Router();

  // eslint-disable-next-line @typescript-eslint/ban-types
  async checkAccess(target = 1, req: Request, res: Response, next: Function) {
    try {
      const entityKey = req.params.id as EntityKeys;
      const entityConfig = this.context.entityEngine.getEntityParams(entityKey);
      if (entityConfig?.permissions) {
        let action: REQ_ACTION;
        switch (req.method) {
          case "GET":
            action = "read";
            break;
          case "POST":
            // eslint-disable-next-line no-case-declarations
            const data = req.body;
            action = data.id ? "edit" : "create";
            break;
          case "DELETE":
            action = "delete";
            break;
        }
        const tt = entityConfig?.permissions?.[action];
        if (tt) {
          target = tt;
        }
      }
      const token = await this.getToken(req);
      const permitted: boolean = await this.hasPermissionByToken(token, target);
      if (!permitted) {
        this.sendNotPermitted(res);
        return;
      }
    } catch (e) {
      console.log("checkAccess error", e);
      this.sendNotPermitted(res, e);
      return;
    }
    next();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  checkPrivateEntity(req: Request, res: Response, next: Function) {
    const entityKey = req.params.id as EntityKeys;
    const entityConfig = this.context.entityEngine.getEntityParams(entityKey);

    entityConfig?.private ? this.sendEntityIsPrivate(res) : next();
  }

  sendTokenNotValid(response: Response, reason?: string) {
    response.status(401);
    response.send({ auth: false, error: reason ? reason : "Токен устарел" });
  }

  sendNotPermitted(response: Response, reason?: string) {
    response.status(403);
    response.send({
      auth: false,
      error: reason ? reason : "Запрошенное действие не разрешено",
    });
  }

  sendEntityIsPrivate(response: Response, reason?: string) {
    response.status(403);
    response.send({
      auth: false,
      error: reason ? reason : "Приватная сущность. Доступ запрещен",
    });
  }

  sendServerError(response: Response, reason?: string) {
    response.status(500);
    response.send({ error: reason ? reason : "Произошла ошибка сервера" });
  }

  constructor(private context: Context) {
    this.context.authorizationEngine = this;

    this.auth.get("/uuid", this.uuidHandler);

    this.auth.get("/role", this.roleHandler.bind(this));

    this.auth.get("/user", this.userHandler.bind(this));

    this.auth.get("/url", this.urlHandler.bind(this));

    this.auth.get("/activation/:code", this.activationHandler.bind(this));

    this.auth.delete("/", jsonparser, this.deleteHandler.bind(this));

    this.auth.delete(
      "/all",
      jsonparser,
      this.deleteEverywhereHandler.bind(this)
    );

    this.auth.patch("/", jsonparser, this.patchHandler.bind(this));

    this.auth.put("/", jsonparser, this.putHandler.bind(this));

    this.auth.post("/", jsonparser, this.postHandler.bind(this));
  }

  async getToken(req: Request): Promise<string> {
    const token = req.headers?.["token"] as string;
    if (!token) return Promise.reject("Токен не передан");
    return token;
  }

  getUserAgent(req: Request): string {
    return req.headers?.["user-agent"] ?? ("" as string);
  }

  async getUserById(id: number): Promise<User> {
    const q = `SELECT * FROM \`users\` WHERE \`id\` = ${id}`;

    return this.context.dbe
      .queryList<UserSrc>(q)
      .pipe(
        map((result) => result?.[0]),
        map((userSrc) => new User(userSrc))
      )
      .toPromise();
  }

  async getUserByIdSafetly(id: number): Promise<User> {
    return this.context.entityEngine
      .getEntities("ent_users", null, null, id)
      .pipe(map(([user]) => new User(user as UserSrc)))
      .toPromise();
  }

  async getUserIdByToken(token: string): Promise<number> {
    const q = `SELECT * FROM \`sessions\` WHERE \`token\` = "${token}"`;

    return this.context.dbe
      .queryList(q)
      .pipe(map((result) => (result as any as UserSession)?.[0]?.user_id))
      .toPromise();
  }

  async getSessionByToken(token: string): Promise<number> {
    const q = `SELECT * FROM \`sessions\` WHERE \`token\` = "${token}"`;

    return this.context.dbe
      .queryList(q)
      .pipe(map((result) => (result as any as UserSession)?.[0]?.id))
      .toPromise();
  }

  async getRoleByUserId(user_id: number): Promise<UserRole> {
    const q = `SELECT \`roles\`.*, \`users\`.\`id\` as user_id FROM users, roles WHERE users.id = ${user_id} AND users.role = roles.id`;
    return this.context.dbe
      .queryList<UserRole>(q)
      .pipe(map((result: UserRole[]) => (result[0] ? result[0] : null)))
      .toPromise();
  }

  async hasPermissionByToken(token: string, target: number): Promise<boolean> {
    const role = await this.getRoleByToken(token);
    return (role.rank - target || 0) >= 0;
  }

  async getRoleByToken(token: string): Promise<UserRole> {
    const user = await this.getUserIdByToken(token);
    if (!user) return Promise.reject("Пользователь не найден");
    const role = await this.getRoleByUserId(user);
    if (!role) return Promise.reject("Роль не найдена");
    delete role["user_id"];

    return role;
  }

  async hasPermissionByUser(user_id: number, target: number): Promise<boolean> {
    const role = await this.getRoleByUserId(user_id);
    if (!role) return Promise.reject("Роль не найдена");

    return (role.rank - target || 0) >= 0;
  }

  async getUserIdByCredential(
    login: string,
    password: string
  ): Promise<number> {
    const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}" AND password = "${password}"`;

    return this.context.dbe
      .queryList<UserSrc>(q)
      .pipe(map((result) => result?.[0]?.id))
      .toPromise();
  }

  async getUserIdByActivation(activation: string): Promise<number> {
    const q = `SELECT * FROM \`users\` WHERE \`activation\` = "${activation}"`;

    // console.log('getUserIdByActivation: ', q);

    return this.context.dbe
      .queryList<UserSrc>(q)
      .pipe(map((result) => result?.[0]?.id))
      .toPromise();
  }

  async getGuestID(): Promise<number> {
    const q = `SELECT * FROM \`users\` WHERE \`login\` = "guest" AND password IS NULL`;

    return this.context.dbe
      .queryList<UserSrc>(q)
      .pipe(map((result) => result?.[0]?.id))
      .toPromise();
  }

  async checkUserExist(login: string): Promise<boolean> {
    const q = `SELECT * FROM \`users\` WHERE \`login\` = "${login}"`;
    // console.log('q: ', q);

    return this.context.dbe
      .queryList<UserSrc>(q)
      .pipe(map((result) => !!result?.[0]?.id))
      .toPromise();
  }

  async cleanOldTokens(userId: number): Promise<null> {
    const q = `DELETE FROM \`sessions\` WHERE \`user_id\` = ${userId}`;

    return this.context.dbe.queryList(q).pipe(mapTo(null)).toPromise();
  }

  async cleanCurrentSession(token: string): Promise<null> {
    const q = `DELETE FROM \`sessions\` WHERE \`token\` = "${token}"`;

    return this.context.dbe.queryList(q).pipe(mapTo(null)).toPromise();
  }

  async createNewSession(userId): Promise<string> {
    const token: string = uuid.v4();
    const q = `INSERT INTO \`sessions\` (\`token\`, \`user_id\`) VALUES("${token}",${userId})`;

    return this.context.dbe
      .query<OkPacket>(q)
      .pipe(map((result) => (result?.insertId ? token : null)))
      .toPromise();
  }

  async createNewUser(
    userLogin: string,
    userPassword: string
  ): Promise<{ id: number; activation: string }> {
    const token: string = uuid.v4();
    const q = `INSERT INTO \`users\` (\`login\`, \`password\`, \`role\`, \`activation\`) 
        VALUES("${userLogin}", "${userPassword}", 1, "${token}")`;

    return this.context.dbe
      .query<OkPacket>(q)
      .pipe(
        map((result) => result?.insertId),
        map((id) => ({ id, activation: token }))
      )
      .toPromise();
  }

  async activateNewUser(activation: string): Promise<null> {
    if (!activation) return Promise.reject("Нет токена активации");
    try {
      const userId = await this.getUserIdByActivation(activation);
      const q = `UPDATE \`users\` SET \`active\` = 1, \`role\`= 2 WHERE \`id\` = ${userId}`;
      return this.context.dbe.queryList(q).pipe(mapTo(null)).toPromise();
    } catch (e) {
      return Promise.reject("Пользователя с таким кодом активации не найден");
    }
  }

  async changePasswordForUser(
    userLogin: string,
    userPassword: string
  ): Promise<null> {
    const q = `UPDATE \`users\` SET \`password\` = "${userPassword}" WHERE \`login\` = "${userLogin}"`;

    return this.context.dbe.queryList(q).pipe(mapTo(null)).toPromise();
  }

  async changeUserForSession(
    token: string,
    userId: number,
    ua: string
  ): Promise<OkPacket> {
    // проверяем есть ли сессия
    const sessionId = await this.getSessionByToken(token);
    if (!sessionId) return Promise.reject("Активная сессия не найдена");

    const q = `UPDATE \`sessions\` SET \`user_id\` = ${userId}, \`user_agent\` = "${ua}" WHERE \`id\` = ${sessionId}`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  async changeUserToGuestForAllSessions(userId): Promise<OkPacket> {
    const guestID = await this.getGuestID();
    const q = `UPDATE \`sessions\` SET \`user_id\` = ${guestID} WHERE \`user_id\` = ${userId}`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  // Генератор токена
  async uuidHandler(req, res) {
    res.send({ uuid: uuid.v4() });
  }

  // Получение данный роли
  async roleHandler(req, res) {
    try {
      const token = await this.getToken(req);
      const session = await this.getSessionByToken(token);
      if (!session) {
        this.sendTokenNotValid(res, "Токен сессии не верный или устарел");
        return;
      }
      const role = await this.getRoleByToken(token);
      res.send(role);
    } catch (e) {
      this.sendNotPermitted(res, e);
    }
  }

  // Получение данных пользователя
  async userHandler(req, res) {
    try {
      const token = await this.getToken(req);
      const session = await this.getSessionByToken(token);
      if (!session) {
        this.sendTokenNotValid(res, "Токен сессии не верный или устарел");
        return;
      }
      const user_id = await this.getUserIdByToken(token);
      const user = await this.getUserById(user_id);
      delete user.password;
      res.send(user);
    } catch (e) {
      console.log("userHandler", e);
      this.sendNotPermitted(res, e);
    }
  }

  // выход из сессии
  async deleteHandler(req, res) {
    // console.log('delete auth', req.headers);
    try {
      const token = await this.getToken(req);
      const guestID = await this.getGuestID();
      const ua = this.getUserAgent(req);

      await this.changeUserForSession(token, guestID, ua);

      // await this.cleanCurrentSession(token);
      res.send(
        JSON.stringify({
          exit: true,
          msg: "Сессия завершениа",
          token,
        })
      );
    } catch (e) {
      console.log("userHandler", e);
      this.sendNotPermitted(res, e);
    }
  }

  // выход из устройств
  async deleteEverywhereHandler(req, res) {
    console.log("delete auth", req.headers);
    try {
      const token = await this.getToken(req);
      const user_id = await this.getUserIdByToken(token);
      const guest = await this.getGuestID();

      if (guest !== user_id) {
        await this.changeUserToGuestForAllSessions(user_id);
      }

      res.send(
        JSON.stringify({
          exit: true,
          msg: "Все сесси текущего пользователя завершены",
          token,
          user: user_id,
        })
      );
    } catch (e) {
      console.log("userHandler", e);
      this.sendNotPermitted(res, e);
    }
  }

  // активация пользователя
  async activationHandler(req, res) {
    console.log("activation", req.params);
    try {
      const code: string = req.params["code"];
      await this.activateNewUser(code);
      res.send(
        JSON.stringify({
          activation: true,
          msg: "Активация пользователя прошла успешно",
        })
      );
    } catch (e) {
      console.log("activationHandler", e);
      this.sendServerError(res, e);
    }
  }

  // активация пользователя
  async urlHandler(req, res) {
    res.send(
      JSON.stringify({
        url: `${req.headers}`,
      })
    );
  }

  // смена пароля
  async patchHandler(req, res) {
    const userLogin: string = req.body["login"];
    const userPassword: string = req.body["password"];

    try {
      const token = await this.getToken(req);
      if (userLogin && userPassword) {
        // получаем id юзера
        const userId = await this.getUserIdByCredential(
          userLogin,
          userPassword
        );
        if (userId) {
          await this.changePasswordForUser(userLogin, userPassword);
          res.send(
            JSON.stringify({
              changePassword: true,
              login: userLogin,
              token,
              id: userId,
            })
          );
        } else {
          res.status(500);
          res.send(
            JSON.stringify({
              changePassword: false,
              error: "Не верные данные для смены пароля",
              login: userLogin,
            })
          );
        }
      }
    } catch (e) {
      console.log("patchHandler", e);
      this.sendNotPermitted(res, e);
    }
  }

  // регистрация ... новый юзверь
  async putHandler(req, res) {
    console.log("put auth", req.body);
    const userLogin: string = req.body["login"];
    const userPassword: string = req.body["password"];
    if (userLogin && userPassword) {
      // получаем id юзера
      const userExist = await this.checkUserExist(userLogin);
      if (!userExist) {
        const newUser = await this.createNewUser(userLogin, userPassword);

        res.send(
          JSON.stringify({
            signup: true,
            activated: false,
            login: userLogin,
            password: userPassword,
            url: `${req.protocol}://${req.headers.host}/auth/activation/${newUser.activation}`,
            activation: newUser.activation,
            id: newUser.id,
          })
        );
      } else {
        res.status(500);

        const userID = await this.getUserIdByCredential(
          userLogin,
          userPassword
        );
        const user = await this.getUserById(userID);

        res.send(
          JSON.stringify({
            signup: false,
            activated: !!user?.active,
            error: "Пользователь с таким логином уже существует",
            login: userLogin,
            activation: user?.activation,
          })
        );
      }
    } else {
      res.status(500);

      res.send(
        JSON.stringify({
          signup: false,
          error: "Не переданы необходимые данные для регистрации",
        })
      );
    }
  }

  // авторизация ... создание сессии
  async postHandler(req, res) {
    console.log("post auth", req.body);
    const userLogin: string = req.body["login"];
    const userPassword: string = req.body["password"];
    const userAgent: string = this.getUserAgent(req);
    let token = null;
    let userId: number = null;

    try {
      token = await this.getToken(req);
    } catch (e) {
      console.log("postHandler ERROR", e);
    }

    if (userLogin && userPassword && token) {
      userId = await this.getUserIdByCredential(userLogin, userPassword);
    } else {
      userId = await this.getGuestID();
      token = await this.createNewSession(userId);
    }

    if (userId) {
      try {
        await this.changeUserForSession(token, userId, userAgent);
        res.send(
          JSON.stringify({
            auth: true,
            token,
            login: userLogin,
            id: userId,
          })
        );
      } catch (error) {
        res.status(401);
        res.send(
          JSON.stringify({
            auth: false,
            login: userLogin,
            error,
          })
        );
      }
    } else {
      res.status(401);
      res.send(
        JSON.stringify({
          auth: false,
          login: userLogin,
          error: "Логин и пароль не совпадают либо токен не ",
        })
      );
    }
  }

  getRouter() {
    return this.auth;
  }
}

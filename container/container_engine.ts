import * as express from "express";
import bodyparser from 'body-parser';
import {Router} from "express";
import {Context} from "../search.engine/config";
import {Container} from "./container_repo";
import {mapTo, tap} from "rxjs/operators";
const containers = require('../container/container_repo');
const jsonparser = bodyparser.json();

export class ContainerEngine {
    container = express.Router();

    constructor(private context: Context) {
        this.context.containerEngine = this;
    }

    // функция возвращающая список существующих в системе контейнеров
    getContainersList(req, res) {
        res.send(Object.keys(containers).map(k => containers[k]));
    }

    async getContainerRepo(containerParams: Container, cid?: number) {
        const whereStr = cid ? `WHERE \`id\`=${cid}` : '';
        const q = 'SELECT * FROM `' + containerParams.db_list + '`' + whereStr;

        return this.context.dbe.query<{ id: number, items: any[], q: Promise<any> }>(q).toPromise();
    }

    // функция возвращающая объекты контейнера по имени
    async getContainer(containerParams: Container, cid?: number) {
        const repo = await this.getContainerRepo(containerParams, cid);

        const subQueries = repo.map(r => {
            if (!r.id) return;

            const id = r.id;
            const qi = `SELECT \`${containerParams.db_links}\`.*, 
                                \`${containerParams.db_entity}\`.\`id\` as \`eid\`, 
                                ${containerParams.entity_fields.map(f => `\`${containerParams.db_entity}\`.\`${f}\``).join(', ')} 
                                FROM \`${containerParams.db_links}\`
                                LEFT JOIN \`${containerParams.db_entity}\` 
                                ON \`${containerParams.db_links}\`.\`${containerParams.container_id_key}\` = \`${containerParams.db_entity}\`.\`id\`
                                WHERE \`${containerParams.db_links}\`.\`container_id\`=${id}`;

            console.log('qi: ', qi);

            return this.context.dbe.query<{ entity: any }>(qi).toPromise().then((items) => {

                items.forEach(item => {
                    item.entity = {};

                    containerParams.entity_fields.forEach(field => {
                        item.entity[field] = item[field];
                        item.entity['id'] = item['eid'];
                        delete item[field];
                    });
                });

                r.items = items;
                console.log('entity: ', r);
            });
        });

        return Promise.all(subQueries).then(() => repo);
    }

    async simpleSaveContainer(containerParams, id_container, ids) {
        //проверка валидности ключа сущности для контейнера
        if (containerParams && id_container && Array.isArray(ids)) {

            const id_key = containerParams.container_id_key;
            const links_db = containerParams.db_links;

            // delete exist container store and write new

            // console.log("DEV containerParams:", containerParams);

            const promisesList = ids.map(cur_id => {
                const q = `INSERT INTO \`${links_db}\` (\`container_id\`, \`${id_key}\` ) VALUES(${id_container}, ${cur_id})`;
                console.log('simpleSaveContainer promisesList q:', q);

                return this.context.dbe.query(q)
                    .pipe(
                        tap(() => console.log('запись о контейнере с id ', cur_id, 'добавлена в БД')))
                    .toPromise();
            });

            try {
                await this.removeContainerItems(containerParams.name, id_container);
                await Promise.all(promisesList);
                return Promise.resolve('все записи по контейнеру сохранены в БД');
            } catch (e) {
                return Promise.reject(e);
            }

        } else return Promise.reject({error: 'Недостаточно входных данных для работы с контейнером(links_db && id_container && Array.isArray(ids))'});
    }

    async saveContainerHandler(req, res) {
        console.log(req.body, req.params);
        //проверка валидности ключа сущности для контейнера
        const data = req.body;
        if (!!containers[req.params.name] && data.ids) {
            let containerParams = containers[req.params.name];
            const container_id = req.params.cid;

            try {
                const result = await this.simpleSaveContainer(containerParams, container_id, data.ids);
                res.send({status: result});
            } catch (e) {
                console.error(e);
                res.status(500);
                res.send({error: JSON.stringify(e)});
            }

        } else {
            res.status(500);
            res.send({error: 'Контейнер не найден или отсутствуют ids'});
        }
    }

    async removeContainerFromRepo(name, id) {
        if (!!containers[name]) {
            let containerParams = containers[name];
            const db_repo = containerParams.db_list;
            const qd = `DELETE FROM \`${ db_repo }\` WHERE id=${id}`;

            return this.context.dbe.query(qd)
                .pipe(mapTo('Контейнер с name: ' + name + ' и id: ' + id + ' удален из репозитория'))
                .toPromise();
        } else return Promise.reject('Удаляемый контейнер не найден');
    }

    async removeContainerItems(name, id) {
        //проверка валидности ключа сущности для контейнера
        if (!!containers[name]) {

            let containerParams = containers[name];
            const db_cont = containerParams.db_links;

            //  удаляем связив блоке контейнеров
            let qdd = `DELETE FROM \`${ db_cont }\` WHERE container_id=${id}`;

            return this.context.dbe.query<null>(qdd).pipe(mapTo(`Записи контейнеров с id = ${id} удалены`)).toPromise();

        } else return Promise.reject('Контейнер не найден');
    }

    async deleteContainerHandler(req, res) {
        if (req.params.cid && req.params.name) {
            console.log('delete params:', req.params);
            const id = req.params.cid;
            const name = req.params.name;

            try {
                await this.removeContainerItems(name, id);
                await this.removeContainerFromRepo(name, id);
                res.send({status: 'Данные о контейнере ' + id + ' удалены'});
            } catch (e) {
                res.status(500);
                res.send({error: e});
            }
        }
    }

    async getContainerHandler(req, res) {
        console.log('getContainer', req.params);
        if (!req.params.name) {
            res.status(500);
            res.end(JSON.stringify({error: 'ошибка доступа : не указан контейнер'}));
            console.warn('ошибка доступа : не указан контейнер');

            return;
        }
        let name = req.params.name;
        if (!!containers[name] &&
            (
                !!containers[name].db_entity &&
                !!containers[name].db_links &&
                !!containers[name].db_list
            )) {

            let containerParams = containers[name];
            let cid = req.params.cid;

            try {
                res.send(await this.getContainer(containerParams, cid))
            } catch (error) {
                res.status(500);
                res.send(JSON.stringify({error}));
            }
        } else {
            res.status(500);
            res.send(JSON.stringify({error: 'ошибка доступа : Запрошенный контейнер не существует'}));
            console.warn('ошибка доступа : Запрошенный контейнер не существует');
        }
    }

    getRouter(): Router {
        this.container.get('/', this.getContainersList);
        this.container.get('/:name', this.getContainerHandler.bind(this));
        this.container.get('/:name/:cid', this.getContainerHandler.bind(this));
        this.container.post('/:name/:cid', jsonparser, this.saveContainerHandler.bind(this));
        this.container.delete('/:name/:cid', this.deleteContainerHandler.bind(this));

        return this.container;
    }
}



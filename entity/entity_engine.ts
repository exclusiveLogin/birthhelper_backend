import * as express from "express";
const bodyParser = require('body-parser');
import validator from 'validator';
import {Request, Router} from 'express';
import fs from "fs";
import multer from 'multer';
import {CacheEngine} from "../cache.engine/cache_engine";
import {entityRepo} from './entity_repo';
import {SearchEngine} from "../search.engine/engine";
import {Context, SectionKeys} from "../search.engine/config";
import {forkJoin, Observable, of} from "rxjs";
import {map, mapTo, switchMap, take, tap} from "rxjs/operators";
import {concatFn, generateQStr} from "../db/sql.helper";
import {EntityCalc, EntityField} from "../entity/entity_repo.model";
import {cacheKeyGenerator} from "../search.engine/sections.handler";

const pool = require('../db/sql');
const jsonparser = bodyParser.json();

const containers = require('../container/container_repo');
const slots = require('../slot/slot_repo');
const dict = require('../dictionary/dictionary_repo');

const entities = entityRepo;
const sanitizer = validator.escape;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const originalname = file.originalname.split('.');
        const newName = originalname[0] + '_' + Date.now() + '.' + originalname[1];
        cb(null, newName);
    }
});

const fileFilter = (req, file, cb) => file && file.mimetype === 'image/jpeg' ? cb(null, true) : cb(null, false);

const upload = multer({storage: storage, fileFilter});
const entity = express.Router();

interface Entity {
    [key: string]: any;
    id: number;
}

interface FKEntity {
    key: string;
    value: Entity[];
    id: number;
}

interface CalcEntity {
    key: string;
    value: any;
    id: number;
}

export class EntityEngine {
    cacheEngine: CacheEngine;
    searchEngine: SearchEngine;

    constructor(context: Context, admin?: boolean) {
        this.searchEngine = context.searchEngine;
        this.cacheEngine = context.cacheEngine;
    }

    entitySetHandler(req, res): void {
        if (!!entities[req.params.id] && !!entities[req.params.id].db_name) {

            const likeStr = [...generateQStr(req, 'string'), ...generateQStr(req, 'flag')].join(' AND ');
            const whereStr = [...generateQStr(req, 'id')].join(' AND ');

            const q = `SELECT * 
                        FROM \`${ entities[req.params.id].db_name }\`
                        ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                        ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} `;

            pool.query(q, (err, result) => {
                const lenSet = result && result.length || 0;
                const con = entities[req.params.id].container || null;
                const slot = entities[req.params.id].slot || null;
                res.send({
                    total: lenSet,
                    fields: entities[req.params.id].fields || [],
                    container: con ? containers[con] : null,
                    slot: slot ? slots[slot] : null,
                    links: entities[req.params.id].links || [],
                });
            });
        } else {
            res.send([]);
        }
    }

    entityFilterHandler(req, res): void {
        if (!!entities[req.params.id] && !!entities[req.params.id].filters) {
            res.send(JSON.stringify(entities[req.params.id].filters))
        } else {
            res.send([]);
        }
    }

    rootHandler(req, res) {
        res.set('Content-Type', 'text/html');
        res.write('Эндпоинт для сущностей доступны следующие: <br>');
        Object.keys(entities).forEach(key => res.write(key + '<br>'));

        res.write('<p> Формат запроса GET /entity/{key} </p> <br>');
        res.write('<p> ex: GET http://birthhelper.ru/admin/entity/ent_services </p> <br>');
        res.end();
    }

    query<T>(q: string): Observable<T[]> {
        return new Observable<T[]>(observer => {
            pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result);
                observer.complete();
            });
        });
    }

    createEntityHandler(req, res, next) {
        console.log('createEntity body:', req.body);
        if (req.body) {
            //проверка наличия сущности в системе
            if (!!entities[req.params.id] && !!entities[req.params.id].db_name) {
                const db = entities[req.params.id].db_name;
                const reqKeys = entities[req.params.id].fields.filter(f => !!f.required);
                const fields = entities[req.params.id].fields;
                const calc = entities[req.params.id].calculated;
                const data = req.body;

                //убираем пересечения
                calc && calc.forEach(c => delete data[c.key]);

                if (!reqKeys.every(r => !!data[r.key])) {
                    res.end('не полные данные в запросе');
                    console.log('не полные данные в запросе');
                    return;
                }

                if (!Object.keys(data).every(r => !!fields.find(f => f.key === r))) {
                    res.end('в запросе присутствут неизвестные поля');
                    console.log('в запросе присутствут неизвестные поля');
                    return;
                }

                let valArr = Object.keys(data).map(datakey => {
                    const targetReq = fields.find(r => r.key === datakey);
                    if (!targetReq) return;
                    `"${sanitizer((data[datakey]).toString())}"`;
                    return targetReq.type === 'string' || targetReq.type === 'text' ? `"${sanitizer((data[datakey]).toString())}"` : data[datakey];
                });

                let existArr = concatFn(Object.keys(data), valArr);
                //console.log('existArr: ', existArr);

                const q = `INSERT INTO \`${ db }\` (\`${ Object.keys(data).join('\`, \`') }\`) VALUES ( ${ valArr.join(',') } )`;
                const qi = existArr.join(', ');
                const qf = q + ' ON DUPLICATE KEY UPDATE ' + qi;
                console.log('qf: ', qf);


                pool.query(qf, (err, result) => {
                    if (err) {
                        res.status(500);
                        res.send(err);
                        return;
                    }
                    res.send(JSON.stringify({
                        result,
                        data
                    }));
                    next();
                });

            } else {
                res.end('не удалось определить сущность');
                console.log('не удалось определить сущность');
            }
        }
    }

    deleteEntityHandler(req, res, next) {
        console.log('delete middle', req.body);
        if (req.body) {
            //проверка наличия сущности в системе
            if (!!entities[req.params.id] && !!entities[req.params.id].db_name) {
                const db = entities[req.params.id].db_name;
                const id = req.body && req.body.id;

                const qd = `DELETE FROM \`${ db }\` WHERE id=${id}`;

                pool.query(qd, (err, result) => {
                    if (err) {
                        res.status(500);
                        res.send(err);
                        return;
                    }
                    res.send(JSON.stringify({
                        result,
                        text: `Запись с id = ${id} удалена`
                    }));

                    next();

                });

            } else {
                res.end('не удалось определить сущность');
            }
        }
    }

    getEntitiesByIds(ids: number[], key: string, req: Request): Observable<Entity[]> {
        const db = entities[req.params.id].db_name;
        const cacheKey = cacheKeyGenerator(key, 'hash', ids);
        const skip = req.query.skip ? Number(req.query.skip) : 0;
        ids = ids.splice(skip, 20);
        const whereStr = ids.length ? `${ids.map(id => 'id = ' + id).join(' OR ')}` : null;

        // default query
        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : 'WHERE 0'}`;

        // console.log('getEntityByIds q: ', q);
        return of(cacheKey)
            .pipe(
                switchMap(key => this.cacheEngine.checkCache(key) ?
                    this.cacheEngine.getCachedByKey<Entity[]>(key) :
                    this.query<Entity>(q).pipe(tap(data => this.cacheEngine.saveCacheData(key, data)))));
    }

    getEntityPortion(key: string, req: Request): Observable<Entity[]> {
        const db = entities[req.params.id].db_name;
        const fk = entities[req.params.id].fk;
        const eid = req.params.eid;

        let limit = !!req.query.limit && Number(req.query.limit) || '20';
        let likeStr = [...generateQStr(req, 'string'), ...generateQStr(req, 'flag')].join(' AND ');
        let whereStr = [...generateQStr(req, 'id')].join(' AND ');
        let limstr = `${!!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip : ' LIMIT ' + limit}`;

        // default query
        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : ''} ${likeStr ? (whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} ${limstr}`;

        //link fk for parent table
        if (fk) {
            //searching keys
            let s_str = fk.restrictors.map(r => fk.db + '.' + r.key).join(', ');
            //restrictor statements
            let r_str = fk.restrictors.map(r => fk.db + '.' + r.key + ' LIKE "' + r.value + '"').join(', ');
            //target fields db
            let t_str = fk.target.map(t => fk.db + '.' + t).join(', ');

            q = `SELECT 
                ${db}.*, 
                ${fk.db}.id as _id, 
                ${s_str}, 
                ${t_str} 
                FROM ${db} 
                INNER JOIN ${fk.db} 
                ON ${db}.${fk.key} = ${fk.db}.id 
                WHERE ${r_str} 
                ${ eid ? `AND ${db}.id = ${eid}` : ``} 
                ${whereStr ? 'AND ' + whereStr : ''} 
                ${likeStr ? ' AND ' + likeStr : ''} 
                ${limstr}`;
        } else
            q = `SELECT 
                * 
                FROM \`${ db }\` 
                ${ eid ? `WHERE id = ${ eid }` : ``}
                ${(whereStr && !eid) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

        return this.query<Entity>(q);
    }

    getEntities(key: string, hash: string, req: Request): Observable<Entity[]> {
        const searchKey: SectionKeys = entities[req.params.id].searchKey;

        if(hash){
            const ids$ = this.searchEngine.getEntitiesIDByHash(searchKey, hash);
            return ids$ ?
                ids$.pipe(
                    switchMap(_ => this.getEntitiesByIds(_, key, req))) :
                null;
        }

        return this.getEntityPortion(key, req);
    }

    queryEntityHandler(req, res, next) {
        // console.log('ent req search: ', req.query, ' url params: ', req.params, ' cache: ', ce);
        if (!!entities[req.params.id]) {
            const entKey = req.params.id;
            const hash = req.query.hash;

            console.log('queryEntityHandler hash: ', hash);

            const fields = entities[req.params.id].fields;
            const calc = entities[req.params.id].calculated;

            // если спросили что то лишнее хотя с новой логикой сюда не попадуть те запросы которых нет в репозитории доступных
            if (!Object.keys(req.query).every(r => !!(r === 'skip' || r === 'limit' || r === 'hash') || !!fields.find(f => f.key === r))) {
                res.status(500);
                res.end('в запросе поиска присутствуют неизвестные поля');
                console.warn('в запросе поиска присутствуют неизвестные поля');
                return;
            }

            let provider = this.getEntities(entKey, hash, req);

            if(!provider) {
                res.status(500);
                res.send({error: 'Hash unknown'});
                return;
            }

            provider = this.metanizer(provider, fields, calc);

            provider.subscribe(
                (data) => {
                    res.send(data);
                },
                (error) => {
                    console.log('subscribe error', error);
                    res.status(500);
                    res.send(JSON.stringify(error));
                },
            )
        } else {
            res.send([]);
            console.log('сущность не определена');
        }
    }

    metanizer(pipeline: Observable<Entity[]>, fields: EntityField[], calc: EntityCalc[]): Observable<Entity[]> {
        return pipeline.pipe(
            // FK
            switchMap((data: Entity[]) => {
                console.log('FK tick', data.length);
                const qs: Observable<FKEntity>[] = []
                data.forEach(row => {
                    Object.keys(row).forEach(k => {
                        const targetReq = fields.find(r => r.key === k);
                        const value = row[k];

                        if (targetReq?.type === 'string' || targetReq?.type === 'text') {
                            row[k] = validator.unescape(`${value}`);
                        }

                        if (targetReq?.loadEntity && value) {
                            if (targetReq?.type === 'img') {
                                const q = `SELECT \`images\`.*, \`files\`.\`filename\` 
                                                FROM \`files\` 
                                                INNER JOIN \`images\` 
                                                ON \`images\`.\`file_id\` = \`files\`.\`id\` 
                                                WHERE \`images\`.\`id\` = ${row[k]}`;

                                qs.push(
                                    this.query<Entity>(q).pipe(
                                        map(a_result => ({key: targetReq.key, value: a_result, id: row.id})))
                                );
                            }

                            if (targetReq?.type === 'id') {
                                const db = targetReq.dctKey ? dict[targetReq.dctKey].db : null;
                                if (db) {
                                    const q = `SELECT * FROM \`${db}\` WHERE \`id\` = ${row[k]}`;

                                    qs.push(
                                        this.query<Entity>(q).pipe(
                                            map(a_result => ({key: targetReq.key, value: a_result, id: row.id})))
                                    );
                                }
                            }
                        }
                    })
                })

                console.log('FK que count', qs.length);
                return qs.length ?
                    forkJoin(qs).pipe(
                        take(1),
                        tap((_data: FKEntity[]) => {
                            _data.forEach(d => {
                                const t_row: Entity = data.find(r => r.id === d.id);
                                if (t_row) {
                                    t_row.meta = t_row.meta ?
                                        {...t_row.meta, [d.key]: d.value ? d.value?.[0] : null} :
                                        {[d.key]: d.value ? d.value?.[0] : null}
                                }
                            });
                        }),
                        mapTo(data)) :
                    of(data);
            }),
            // CALC
            switchMap((data: Entity[]) => {
                if(!calc) return of(data);
                console.log('CALC tick', data.length);
                const qs: Observable<CalcEntity>[] = []
                data.forEach(row => {
                    const id = row.id;
                    calc.forEach(clc => {
                        switch (clc.type) {
                            case 'count':
                                const aq = `SELECT * FROM \`${ clc.db_name }\` WHERE \`${ clc.id_key }\`='${id}'`;
                                qs.push(this.query(aq).pipe(map(a_result => ({
                                    key: clc.key,
                                    value: a_result.length,
                                    id
                                }))));
                                break;
                            case 'test':
                                qs.push(of({key: clc.key, value: 'test', id}));
                                break;
                            default:
                        }
                    });
                })

                console.log('CALC que count', qs.length);

                return qs.length ?
                    forkJoin(qs).pipe(
                        take(1),
                        tap((_data) => {
                            _data.forEach(d => {
                                const target = data.find(t => t.id === d.id);
                                if (target) Object.assign(target, {[d.key]: d.value});
                            });
                        }),
                        mapTo(data)) :
                    of(data);
            })
        );
    }

    checkUploadsFSHandler(req, res, next) {
        if (!fs.existsSync('uploads')) {
            console.log('folder upload not exist, creating...');
            fs.mkdirSync('uploads');
        } else {
            console.log('folder upload exist');
        }

        console.log('FS:', ...fs.readdirSync('./'));

        next();
    }

    uploadFileHandler(req, res, next) {
        if (
            (req.file && req.file.mimetype === 'image/jpeg') ||
            (req.file && req.file.mimetype === 'image/jpg')
        ) {

            let fields = ['filename', 'folder', 'type'];
            let values = [`"${req.file.filename}"`, `"uploads"`, `"${req.file.mimetype}"`];

            let meta = req.body && JSON.parse(req.body.meta);

            let {title = 'Без названия', description = 'Без описания'} = meta;
            console.log('meta:', meta);

            let q = `INSERT INTO \`${ 'files' }\` (\`${ fields.join('\`, \`') }\`) VALUES ( ${ values.join(',') } )`;

            console.log('save file in db: ', q);
            pool.query(q, (error, result) => {
                if (error) {
                    res.status(500);
                    res.send(error);
                    return;
                }
                if (result && result.insertId) {
                    let qi = `INSERT INTO \`${ 'images' }\` ( \`file_id\`, \`title\`, \`description\`) VALUES ( ${result.insertId}, "${title}", "${description}" )`;
                    console.log('qi:', qi);
                    pool.query(qi, (err, _result) => {
                        if (err) {
                            res.status(500);
                            res.send(err);
                            return;
                        }

                        res.status(201);
                        res.send({
                            status: 'Файл загружен успешно, id: ' + result.insertId,
                            file: {id: _result.insertId}
                        });
                    });
                }
            });


        } else {
            console.error('error: ', 'Ошибка типа файла. Поддерживаются только: jpeg', 'file: ', req.file);
            res.status(500);
            res.send({error: 'Ошибка типа файла. Поддерживаются только: jpeg'});
        }
    }

    downloadFileHandler(req, res, next) {
        const id = req.params.id;

        //SELECT `images`.*, files.id as fid, files.filename FROM `images`, files WHERE images.id = 2 AND files.id = images.file_id
        //SELECT `images`.*, files.id as fid, files.filename, files.type FROM `images` INNER JOIN files ON images.file_id = files.id WHERE files.type LIKE "%image%" AND images.id = 2

        if (!id) {
            res.status(500);
            res.send({error: 'не передан ID файла'});
        }

        let q = `SELECT * FROM \`files\` WHERE \`id\` = ${id}`;
        console.log('dl file: ', id, 'q: ', q);


        pool.query(q, function (error, result) {
            if (error) {
                res.status(500);
                res.end({error});
            }

            res.send(result);
        });

    }

    getRouter(): Router {
        entity.get('/', this.rootHandler.bind(this));
        entity.get('/:id/filters', this.entityFilterHandler.bind(this));
        entity.get('/:id/set', this.entitySetHandler.bind(this));
        entity.get('/file/:id', this.downloadFileHandler.bind(this));
        entity.get('/:id', this.queryEntityHandler.bind(this));
        entity.get('/:id/:eid', this.queryEntityHandler.bind(this));
        entity.post('/file', this.checkUploadsFSHandler.bind(this), upload.single('photo'), this.uploadFileHandler.bind(this));
        entity.delete('/:id', jsonparser, this.deleteEntityHandler.bind(this));
        entity.post('/:id', jsonparser, this.createEntityHandler.bind(this));

        return entity;
    }
}

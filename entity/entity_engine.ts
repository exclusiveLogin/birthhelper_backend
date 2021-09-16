import * as express from "express";

const bodyParser = require('body-parser');
import validator from 'validator';
import {Request, Router} from 'express';
import fs from "fs";
import multer from 'multer';
import {CacheEngine} from "../cache.engine/cache_engine";
import {entityRepo} from './entity_repo';
import {Entity as EntityConfig} from './entity_repo.model';
import {SearchEngine, Summary} from "../search.engine/engine";
import {Context, SectionKeys} from "../search.engine/config";
import {combineLatest, forkJoin, Observable, of, throwError} from "rxjs";
import {filter, map, mapTo, switchMap, take, tap} from "rxjs/operators";
import {concatFn, generateQStr, getFiltersByRequest, getKeyByRequest} from "../db/sql.helper";
import {EntityCalc, EntityField} from "../entity/entity_repo.model";
import {cacheKeyGenerator} from "../search.engine/sections.handler";
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

export interface Entity {
    [key: string]: any;

    id: number;
    summary?: Summary;
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

export interface FilterParams {
    [key: string]: string;
    skip?: string;
    limit?: string;
}
export class EntityEngine {
    cacheEngine: CacheEngine;
    searchEngine: SearchEngine;

    constructor(private context: Context, admin?: boolean) {
        if (admin){
            context.entityEngineAdmin = this;
        } else {
            context.entityEngine = this;
        }

        this.searchEngine = context.searchEngine;
        this.cacheEngine = context.cacheEngine;
    }

    getEntityParams(name: string): EntityConfig {
        return entities[name];
    }

    hasEntity(name: string): boolean {
        return !!entities[name];
    }

    getSetFromDB(key: string, filters: FilterParams): Observable<number> {
        const db = entities[key].db_name;
        if (!!key && !!db) {

            const likeStr = [...generateQStr(key, filters, 'string'), ...generateQStr(key, filters, 'flag')].join(' AND ');
            const whereStr = [...generateQStr(key, filters, 'id')].join(' AND ');

            const q = `SELECT COUNT(*) as cnt 
                        FROM \`${ db }\`
                        ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                        ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} `;

            console.log('getSetFromDB', q);
            return this.context.dbe.query<Entity>(q).pipe(
                tap(data => console.log('getSetFromDB result:', data)),
                map(result => result.cnt || 0));
        }

        console.log('что то пошло не так... Сущность сета не определена');
        return throwError('Сущность сета не определена');
    }

    entitySetHandler(req, res): void {
        const key = getKeyByRequest(req);
        const filters = getFiltersByRequest(req);
        if (!!key) {
            const hash = req.query.hash;
            const searchKey: SectionKeys = entities[req.params.id].searchKey;
            const con = entities[req.params.id].container || null;
            const slot = entities[req.params.id].slot || null;

            const ids$ = this.searchEngine.getEntitiesIDByHash(searchKey, hash)
                ?.pipe(
                    map(result => result.length || 0));
            const provider = hash && ids$ ? ids$ : this.getSetFromDB(key, filters);

            provider.subscribe(result =>
                    res.send({
                        total: result,
                        fields: entities[req.params.id].fields || [],
                        container: con ? containers[con] : null,
                        slot: slot ? slots[slot] : null,
                        links: entities[req.params.id].links || [],
                    }),
                () => {
                    res.send([]);
                });
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

    garbageHandler(keys: string[], sections: SectionKeys[]): void {
        keys.forEach(k => this.cacheEngine.softClearBykey(k));
        sections.forEach(k => this.searchEngine.resetSearchStoreBySection(k));
        sections.forEach(k => this.searchEngine.resetSummaryStoreBySection(k));
    } 

    async createEntity(name, data) {
        if(!data) return Promise.reject('Нет данных для создания или изменеиня сущности');
        const config = this.getEntityParams(name);
        if(!config) return Promise.reject('Нет конфигурации для сущности: ' + name);

        const db = config.db_name;
        const reqKeys = config.fields.filter(f => !!f.required);
        const fields = config.fields;
        const calc = config.calculated;

        //убираем пересечения
        calc && calc.forEach(c => delete data[c.key]);

        if (!reqKeys.every(r => !!data[r.key])) {
            console.log('не полные данные в запросе');
            return Promise.reject('не полные данные в запросе');
        }

        if (!Object.keys(data).every(r => !!fields.find(f => f.key === r))) {
            console.log('в запросе присутствут неизвестные поля');
            return Promise.reject('в запросе присутствут неизвестные поля');
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

        const createSections = config.createAffectionSectionKeys ?? [];

        return  this.context.dbe.queryList(qf).pipe(
                mapTo('Данные обновлены'),
                tap(() => this.garbageHandler([config.db_name, name], createSections)),
            ).toPromise();
    }

    async createEntityHandler(req, res) {
        console.log('createEntity body:', req.body);
        const data = req.body;
        const name = req.params.id;

        try {
            const result = await this.createEntity(name, data);
            res.send(JSON.stringify({
                result,
                data
            }));

        } catch (e) {
            res.status(500);
            res.send('не удалось определить сущность');
            console.log('не удалось определить сущность');
        }
    }

    async deleteEntity(name: string, id: string) {
        const config = this.getEntityParams(name);
        if (!config) return Promise.reject('не удалось определить сущность');
        const db = config.db_name;
        const deleteSections = config.deleteAffectionSectionKeys ?? [];

        const qd = `DELETE FROM \`${ db }\` WHERE id=${id}`;

        return this.context.dbe.queryList(qd).pipe(
                mapTo(`Запись с id = ${id} удалена`),
                tap(() => this.garbageHandler([config.db_name, name], deleteSections)),
            ).toPromise();
    }

    async deleteEntityHandler(req, res) {
        console.log('delete middle', req.body);
        const id = req?.body?.id;
        const name = req.params.id;

        try {
            const result = await this.deleteEntity(name, id);
            res.send({result});
        } catch (e) {
            res.status(500);
            res.send({error: e});
        }
    }

    getEntitiesByIds(ids: number[], key: string, skip = 0): Observable<Entity[]> {
        const db = entities[key].db_name;
        const cacheKey = cacheKeyGenerator(key, 'hash', ids);
    
        ids = ids.splice(skip, 20);
        const whereStr = ids.length ? `${ids.map(id => 'id = ' + id).join(' OR ')}` : null;

        // default query
        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : 'WHERE 0'}`;

        // console.log('getEntityByIds q: ', q);
        return of(cacheKey)
            .pipe(
                switchMap(k => this.cacheEngine.checkCache(k) ?
                    this.cacheEngine.getCachedByKey<Entity[]>(k) :
                    this.context.dbe.queryList<Entity>(q).pipe(tap(data => this.cacheEngine.saveCacheData(k, data)))));
    }

    getEntityPortion(key: string, filters?: FilterParams, skip: number = 0, limit: number = 20): Observable<Entity[]> {
        const db = entities[key].db_name;

        let likeStr = [...generateQStr(key, filters, 'string'), ...generateQStr(key, filters, 'flag')].join(' AND ');
        let whereStr = [...generateQStr(key, filters, 'id')].join(' AND ');
        let limstr = `${!!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip : ' LIMIT ' + limit}`;

        // default query
        const q = `SELECT 
                * 
                FROM \`${ db }\` 
                ${whereStr ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

        console.log('getEntityPortion: ', q);
       
        return this.context.dbe.queryList<Entity>(q);
    }

    getEntities(key: string, hash: string, filters: FilterParams): Observable<Entity[]> {
        const searchKey: SectionKeys = entities[key].searchKey;
        const skip = Number(filters?.skip ?? '0');
        const limit = Number(filters?.limit ?? '20');

        if (hash) {
            const ids$ = this.searchEngine.getEntitiesIDByHash(searchKey, hash);
            return ids$ ?
                ids$.pipe(
                    switchMap(_ => this.getEntitiesByIds(_, key, skip))) :
                null;
        }

        return this.getEntityPortion(key, filters, skip, limit);
    }

    queryEntityHandler(req, res) {
        // console.log('ent req search: ', req.query, ' url params: ', req.params, this);
        const entKey = getKeyByRequest(req);
        const filters = getFiltersByRequest(req);
        const skip = Number(filters?.skip ?? '0');
        const searchKey: SectionKeys = entities[entKey].searchKey;

        if (!!entKey) {
            const hash = req.query.hash;
            const eid = req.params.eid;
    
            console.log('queryEntityHandler hash: ', hash);

            const fields = entities[entKey].fields;
            const calc = entities[entKey].calculated;

            // если спросили что то лишнее хотя с новой логикой сюда не попадуть те запросы которых нет в репозитории доступных
            if (!Object.keys(req.query).every(r => !!(r === 'skip' || r === 'limit' || r === 'hash') || !!fields.find(f => f.key === r))) {
                res.status(500);
                res.end('в запросе поиска присутствуют неизвестные поля');
                console.warn('в запросе поиска присутствуют неизвестные поля');
                return;
            }

            let provider = eid ? this.getEntitiesByIds([eid], entKey, skip) : this.getEntities(entKey, hash, filters);

            if (!provider) {
                res.status(500);
                res.send({error: 'Hash unknown'});
                return;
            }

            provider = this.metanizer(provider, fields, calc);

            if(searchKey) provider = this.summariezer(provider, searchKey, hash);

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

    summariezer(pipeline: Observable<Entity[]>, sectionKey: SectionKeys, hash: string): Observable<Entity[]> {
        return pipeline.pipe(
            switchMap((entities) => combineLatest([of(entities), this.context.searchEngine.getSummary(sectionKey, hash)])),
            map(([entities, summaries]) => entities.map(ent => ({...ent, summary: summaries.find(_ => _.id === ent.id)}))),
        );
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
                                    this.context.dbe.queryList<Entity>(q).pipe(
                                        map(a_result => ({key: targetReq.key, value: a_result, id: row.id})))
                                );
                            }

                            if (targetReq?.type === 'id') {
                                const db = targetReq.dctKey ? dict[targetReq.dctKey].db : null;
                                if (db) {
                                    const q = `SELECT * FROM \`${db}\` WHERE \`id\` = ${row[k]}`;

                                    qs.push(
                                        this.context.dbe.queryList<Entity>(q).pipe(
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
                                        {[d.key]: d.value ? d.value?.[0] : null};

                                    const targetConfigField = fields.find(f => f.key === d.key);
                                    if(targetConfigField) {
                                        if(targetConfigField.type === 'img') {
                                            t_row.filename = d.value?.[0]?.filename ?? null;
                                        }
                                    }
                                }
                            });
                        }),
                        mapTo(data)) :
                    of(data);
            }),
            // CALC
            switchMap((data: Entity[]) => {
                if (!calc) return of(data);
                console.log('CALC tick', data.length);
                const qs: Observable<CalcEntity>[] = []
                data.forEach(row => {
                    const id = row.id;
                    calc.forEach(clc => {
                        switch (clc.type) {
                            case 'count':
                                const aq = `SELECT * FROM \`${ clc.db_name }\` WHERE \`${ clc.id_key }\`='${id}'`;
                                qs.push(this.context.dbe.queryList(aq).pipe(map(a_result => ({
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

    async uploadFileHandler(req, res) {
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

            try {
                const result = await this.context.dbe.queryList(q).toPromise();
                const insertedId = (result as any as {[key: string]: any, insertId: number}).insertId;

                const qi = `INSERT INTO \`${ 'images' }\` ( \`file_id\`, \`title\`, \`description\`) VALUES ( ${insertedId}, "${title}", "${description}" )`;

                const _result = await this.context.dbe.queryList(qi).toPromise();

                res.status(201);
                res.send({
                    status: 'Файл загружен успешно, id: ' + insertedId,
                    file: {id: (_result as any as {[key: string]: any, insertId: number}).insertId}
                });
            } catch (e) {
                res.status(500);
                res.send({error: e});
                return;
            }
        } else {
            console.error('error: ', 'Ошибка типа файла. Поддерживаются только: jpeg', 'file: ', req.file);
            res.status(500);
            res.send({error: 'Ошибка типа файла. Поддерживаются только: jpeg'});
        }
    }

    async downloadFileHandler(req, res) {
        const id = req.params.id;

        //SELECT `images`.*, files.id as fid, files.filename FROM `images`, files WHERE images.id = 2 AND files.id = images.file_id
        //SELECT `images`.*, files.id as fid, files.filename, files.type FROM `images` INNER JOIN files ON images.file_id = files.id WHERE files.type LIKE "%image%" AND images.id = 2

        if (!id) {
            res.status(500);
            res.send({error: 'не передан ID файла'});
        }

        let q = `SELECT * FROM \`files\` WHERE \`id\` = ${id}`;

        try {
            const result = this.context.dbe.queryList(q).toPromise();
            res.send({result});
        } catch (e) {
            res.status(500);
            res.end({error: e});
        }
    }

    getRouter(): Router {

        entity.get('/',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.rootHandler.bind(this));

        entity.get('/:id/filters',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.entityFilterHandler.bind(this));

        entity.get('/:id/set',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.entitySetHandler.bind(this));

        entity.get('/file/:id',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.downloadFileHandler.bind(this));

        entity.get('/:id',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.queryEntityHandler.bind(this));

        entity.get('/:id/:eid',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.queryEntityHandler.bind(this));

        entity.post('/file',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.checkUploadsFSHandler.bind(this),
            upload.single('photo'),
            this.uploadFileHandler.bind(this));

        entity.delete('/:id',
            jsonparser,
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.deleteEntityHandler.bind(this));

        entity.post('/:id',
            jsonparser,
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.createEntityHandler.bind(this));

        return entity;
    }
}

import * as express from "express";
const bodyParser = require('body-parser');
import validator from 'validator';
import {Request, Router} from 'express';

const jsonparser = bodyParser.json();
import fs from "fs";
import multer from 'multer';

import { entityRepo } from './entity_repo';
import {CacheEngine} from "../cache.engine/cache_engine";

const pool = require('../db/sql');
const containers = require('../container/container_repo');
const slots = require('../slot/slot_repo');
const dict = require('../dictionary/dictionary_repo');

let ce: CacheEngine;

type reqType = 'string' | 'id' | 'flag';

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

const upload = multer({ storage: storage, fileFilter });

const entity = express.Router();

entity.get('/', function(req, res){
    res.set('Content-Type', 'text/html'); 
    res.write('Эндпоинт для сущностей доступны следующие: <br>');
    Object.keys(entities).forEach( key => res.write(key + '<br>') );

    res.write('<p> Формат запроса GET /entity/{key} </p> <br>');
    res.write('<p> ex: GET http://birthhelper.ru/admin/entity/ent_services </p> <br>');
    res.end();

});

function concatFn(arrA, arrB){
    console.log('A:', arrA, 'B:', arrB);
    if( arrA && arrA.length && arrB && arrB.length ){
        let fine = [];
        for(let i = 0; i < arrA.length; i++){
            fine.push(`${arrA[i]} = ${arrB[i]}`);
        }
        return fine;
    }
    return [];
}

function concatLikeFn(arrA, arrB){
    console.log('A:', arrA, 'B:', arrB);
    if( arrA && arrA.length && arrB && arrB.length ){
        let fine = [];
        for(let i = 0; i < arrA.length; i++){
            fine.push(`${arrA[i]} LIKE "%${arrB[i]}%"`);
        }
        return fine;
    }
    return [];
}

function generateQStr(req: Request, type: reqType): string[] {

    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
        const db = entities[req.params.id].db_name;
        const fields = entities[req.params.id].fields;
        const calc = entities[req.params.id].calculated;
        const fk = entities[req.params.id].fk;
        const eid = req.params.eid;

        const filtered = Object.keys(req.query).filter(k => !( k === 'skip' || k === 'limit' ));

        const keys = [];
        const values = [];

        if (type === 'id') {
            keys.push(
                ...filtered.filter(k => ( fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'id' ))
            ) 

            values.push(keys.map( k => req.query[k] ));

            return concatFn(keys, values);
        }

        if (type === 'string') {
            keys.push(
                ...filtered.filter(k => ( fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'string' ))
            ) 

            values.push(keys.map( k => `${req.query[k]}` ));

            return concatLikeFn(keys, values);
        }

        if (type === 'flag') {
            keys.push(
                ...filtered.filter(k => ( fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'flag' ))
            )
            
            values.push(keys.map( k => `${ (req.query[k] as any as boolean) == true ? '1' : '0'}` ));

            return concatLikeFn(keys, values);
        }

    
    }

}

function createEntity(req, res, next){
    console.log('createEntity body:', req.body);
    if( req.body ){
        //проверка наличия сущности в системе
        if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
            const db = entities[req.params.id].db_name;
            const reqKeys = entities[req.params.id].fields.filter(f => !!f.required);
            const fields = entities[req.params.id].fields;
            const calc = entities[req.params.id].calculated;
            const data = req.body;

            //убираем пересечения
            calc && calc.forEach(c => delete data[c.key]);

            if( !reqKeys.every(r => !!data[r.key]) ) {
                res.end('не полные данные в запросе');
                console.log('не полные данные в запросе');
                return;
            }

            if( !Object.keys(data).every(r => !!fields.find(f => f.key === r ))) {
                res.end('в запросе присутствут неизвестные поля');
                console.log('в запросе присутствут неизвестные поля');
                return;
            }

            let valArr = Object.keys(data).map(datakey => {
                const targetReq = fields.find(r => r.key === datakey);
                if(!targetReq) return ;`"${sanitizer((data[datakey]).toString())}"`;
                return targetReq.type === 'string' || targetReq.type === 'text' ? `"${sanitizer((data[datakey]).toString())}"` : data[datakey];
            });

            let existArr = concatFn( Object.keys(data), valArr );
            //console.log('existArr: ', existArr);

            const q = `INSERT INTO \`${ db }\` (\`${ Object.keys(data).join('\`, \`') }\`) VALUES ( ${ valArr.join(',') } )`;
            const qi = existArr.join(', ');
            const qf = q + ' ON DUPLICATE KEY UPDATE ' + qi;
            console.log('qf: ', qf);


            pool.query(qf, (err, result)=> {
                if(err) {
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

function deleteEntity(req, res, next){
    console.log('delete middle', req.body);
    if( req.body ){
        //проверка наличия сущности в системе
        if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
            const db = entities[req.params.id].db_name;
            const id = req.body && req.body.id;

            const qd = `DELETE FROM \`${ db }\` WHERE id=${id}`;

            pool.query(qd, (err, result)=> {
                if(err) {
                    res.status(500);
                    res.send(err);
                    return;
                }
                res.send(JSON.stringify({
                    result,
                    text:`Запись с id = ${id} удалена`
                }));

                next();

            });

        } else {
            res.end('не удалось определить сущность');
        }
    }
}

async function queryEntity( req, res, next ){
    
    console.log('ent req search: ', req.query, ' url params: ', req.params, ' cache: ', ce);
    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
        const db = entities[req.params.id].db_name;
        const fields = entities[req.params.id].fields;
        const calc = entities[req.params.id].calculated;
        const fk = entities[req.params.id].fk;
        const eid = req.params.eid;

        let limit = !!req.query.limit && Number(req.query.limit)  || '20';

        // если спросили что то лишнее хотя с новой логикой сюда не попадуть те запросы которых нет в репозитории доступных
        if( !Object.keys(req.query).every(r => !!( r === 'skip' || r === 'limit' ) || !!fields.find(f => f.key === r ))) {
            res.status(500);
            res.end('в запросе поиска присутствуют неизвестные поля');
            console.warn('в запросе поиска присутствуют неизвестные поля');
            return;
        }

        let likeStr = [...generateQStr(req, 'string'), ...generateQStr(req, 'flag')].join(' AND ');
        let whereStr = [...generateQStr(req, 'id')].join(' AND ');

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;

        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : ''} ${likeStr ? (whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} ${limstr}`;

        
        //link fk for parent table
        if( fk ){
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
       

        console.log('q:', q);
        console.log('like:', likeStr);
        console.log('where:', whereStr);

        pool.getConnection((err, connection)  => {
            if(!!err) {
                res.status(500);
                res.send(JSON.stringify(err));
                return;
            }

            connection.query(q, async (err, result)=> {
                
                connection.release();

                if(!!err) {
                    res.status(500);
                    res.send(JSON.stringify(err));
                }

                const lazy_q: Promise<any>[] = [];

                result.forEach(row => {

                    Object.keys(row).forEach(k => {
                        const targetReq = fields.find(r => r.key === k);

                        if(targetReq?.type === 'string' || targetReq?.type === 'text'){
                            row[k] = validator.unescape(`${row[k]}`);
                        }

                        // асинхронная подгрузка сущности по id 
                        if(targetReq?.loadEntity && row[k] ){

                            // логика загрузки мета сущности для картинки по id
                            if(targetReq?.type === 'img'){
                                const q = `SELECT \`images\`.*, \`files\`.\`filename\` FROM \`files\` INNER JOIN \`images\` ON \`images\`.\`file_id\` = \`files\`.\`id\` WHERE \`images\`.\`id\` = ${row[k]}`;
                                lazy_q.push(new Promise( (_resolve, _reject) => {
                                    pool.getConnection((err, connection) => {
                                        if(err){
                                            _reject(err);
                                            return;
                                        }
                                        connection.query(q, function( err, a_result ){
                                            
                                            connection.release();

                                            if(err){
                                                _reject(err);
                                            }

                                            _resolve({ key: targetReq.key, value: a_result, id: row.id});
                                        });
                                    })
                                    
                                }));
                            }

                            // логика для загрузки ссылочной сущности по id 
                            if(targetReq?.type === 'id'){
                                const db = targetReq.dctKey ? dict[targetReq.dctKey].db : null;

                                if(db){
                                    const q = `SELECT * FROM \`${db}\` WHERE \`id\` = ${row[k]}`;
                                    lazy_q.push(new Promise( (_resolve, _reject) => {
                                        pool.getConnection((err, connection) => {
                                            if(err){
                                                _reject(err);
                                                return;
                                            }
                                            connection.query(q, function( err, a_result ){

                                                connection.release();

                                                if(err){
                                                    _reject(err);
                                                }

                                                _resolve({ key: targetReq.key, value: a_result, id: row.id});
                                            });
                                        });
                                        
                                    }));
                                }
                                
                            }
                        }
                    });
                });

                // проход по всем полям сущности 
                await Promise.all(lazy_q).then(data => {
                    console.log('lazy: ', data);

                    data.forEach(d => {
                        const t_row = result.find(r => r.id === d.id);


                        if(t_row) {
                            t_row.meta = t_row.meta ? 
                            { ...t_row.meta, [d.key]: d.value ? d.value?.[0] : null } :
                            { [d.key]: d.value ? d.value?.[0] : null }
                        }
                    });
                    
                });

                if( calc && result ){
                    let calcPr = result.map((c) => {
                        const id = c.id;
                        return new Promise((resolve, reject)=>{

                            let tmpPr = calc.map(clc => {

                                return new Promise((_resolve, _reject) => {

                                    switch( clc.type ){
                                        case 'count':
                                            const aq = `SELECT * FROM \`${ clc.db_name }\` WHERE \`${ clc.id_key }\`='${id}'`;

                                            console.log('qa: ', aq);

                                            pool.query(aq, function( err, a_result ){
                                                if(err){
                                                    _reject(err);
                                                }

                                                _resolve({ key: clc.key, value: a_result.length});
                                            });
                                            break;

                                        case 'test':
                                            _resolve({key: clc.key, value: 'test'});
                                            break;

                                        default:
                                            _resolve([]);

                                    }

                                });


                            });

                            Promise.all( tmpPr ).then((_results)=>{
                                const mergeField = _results.map((r, idx) => {
                                    Object.assign( c, {[r['key']]: r['value']} );
                                });

                                resolve(c)
                            }).catch(err=>reject(err));


                        })
                    });

                    Promise.all( calcPr ).then((add_results)=>{
                        res.send(add_results);
                    }).catch(er => {
                        console.error('error: ', er);
                        res.status(500);
                        res.send({error: er});
                    });
                }
                else{
                    res.send(result);
                }

            });
        })

        
    } else {
        res.send([]);
        console.log('сущность не определена');
    }
}
function checkUploadsFS(req, res, next) {
    if(!fs.existsSync('uploads')){
        console.log('folder upload not exist, creating...');
        fs.mkdirSync('uploads');
    } else {
        console.log('folder upload exist');
    }
    
    console.log('FS:', ...fs.readdirSync('./'));

    next();
}
function uploadFile( req, res, next ) {
    if(
        (req.file && req.file.mimetype === 'image/jpeg') ||
        (req.file && req.file.mimetype === 'image/jpg')
    ){

        let fields = ['filename', 'folder', 'type'];
        let values = [`"${req.file.filename}"`, `"uploads"`, `"${req.file.mimetype}"`];

        let meta = req.body && JSON.parse(req.body.meta);

        let {title = 'Без названия', description = 'Без описания'} = meta;
        console.log('meta:', meta);

        let q = `INSERT INTO \`${ 'files' }\` (\`${ fields.join('\`, \`') }\`) VALUES ( ${ values.join(',') } )`;

        console.log('save file in db: ', q);
        pool.query(q, (error , result) => {
            if(error) {
                res.status(500);
                res.send(error);
                return;
            }
            if(result && result.insertId){
                let qi = `INSERT INTO \`${ 'images' }\` ( \`file_id\`, \`title\`, \`description\`) VALUES ( ${result.insertId}, "${title}", "${description}" )`;
                console.log('qi:', qi);
                pool.query(qi, (err, _result) => {
                    if(err) {
                        res.status(500);
                        res.send(err);
                        return;
                    }

                    res.status(201);
                    res.send({status: 'Файл загружен успешно, id: ' + result.insertId, file: {id: _result.insertId}});
                });
            }
        });


    } else {
        console.error('error: ', 'Ошибка типа файла. Поддерживаются только: jpeg', 'file: ', req.file);
        res.status(500);
        res.send({error: 'Ошибка типа файла. Поддерживаются только: jpeg'});
    }
}

function downloadFile( req, res, next ){
    const id = req.params.id;

    //SELECT `images`.*, files.id as fid, files.filename FROM `images`, files WHERE images.id = 2 AND files.id = images.file_id
    //SELECT `images`.*, files.id as fid, files.filename, files.type FROM `images` INNER JOIN files ON images.file_id = files.id WHERE files.type LIKE "%image%" AND images.id = 2

    if(!id) {
        res.status(500);
        res.send({error: 'не передан ID файла'});
    }

    let q = `SELECT * FROM \`files\` WHERE \`id\` = ${id}`;
    console.log('dl file: ', id, 'q: ', q);


    pool.query(q, function (error, result) {
        if(error){
            res.status(500);
            res.end({error});
        }

        res.send(result);
    });

}

entity.get('/:id/filters', function(req, res){
    if( !!entities[req.params.id] && !!entities[req.params.id].filters ){
        res.send( JSON.stringify( entities[req.params.id].filters ) )
    } else {
        res.send([]);
    }
});

entity.get('/:id/set', function(req, res){
    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){

        const likeStr = [...generateQStr(req, 'string'), ...generateQStr(req, 'flag')].join(' AND ');
        const whereStr = [...generateQStr(req, 'id')].join(' AND ');

        const q = 
            `SELECT * 
            FROM \`${ entities[req.params.id].db_name }\`
            ${(whereStr) ? 'WHERE ' + whereStr : ''} 
            ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} `;

        pool.query(q, (err, result)=> {
            const lenSet = result && result.length || 0;
            const con = entities[req.params.id].container || null;
            const slot = entities[req.params.id].slot || null;
            res.send({
                total: lenSet,
                fields: entities[req.params.id].fields  || [],
                container: con ? containers[con] : null,
                slot: slot ? slots[slot] : null,
                links: entities[req.params.id].links  || [],
            });
        });
    } else {
        res.send([]);
    }
});

entity.get('/file/:id', downloadFile);
entity.get('/:id', queryEntity);

entity.get('/:id/:eid', queryEntity);

entity.post('/file', checkUploadsFS, upload.single('photo'), uploadFile);


entity.delete('/:id', jsonparser, deleteEntity);

entity.post('/:id', jsonparser, createEntity);

function getEntityMiddleware(_: CacheEngine): Router {
    ce = _;
    return entity;
}

module.exports = getEntityMiddleware;

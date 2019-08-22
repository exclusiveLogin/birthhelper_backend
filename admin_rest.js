let express = require('express');

const cors = require('cors');
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json();

const entities = require('./entity_repo');
const dicts = require('./dict_repo');
const containers = require('./container_repo');

const pool = require('./sql');

let admin = express.Router();
admin.get('/', function(req, res){
    res.send('HELLO DICT ROOT');
});

let dict = express.Router();
dict.get('/:id', cors(), function(req, res){
    if(!!dicts[req.params.id]){

        const dict = dicts[req.params.id];

        let limit = (!!req.query.skip && !!Number(req.query.skip))  || '200';

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ dict.db }\` ${limstr}`;


        //console.log('dict:', req.params.id, limstr, q);
        pool.query(q, (err, result)=> {
            //console.log("dicts:", result);

            if( dict.titleMap || dict.titleAddMap ){
                result.forEach( r => {
                    r.title = dict.titleMap.map(f => r[f]).join(', ');
                    r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                })
                

                //console.log('result:', result);
            }
            res.send(result);
        });

    } else {
        console.log('error', req.params);
        res.send([]);
    }
});

let entity = express.Router();
entity.get('/', cors(), function(req, res){
    res.set('Content-Type', 'text/html'); 
    res.write('Эндпоинт для сущностей доступны следующие: <br>');
    Object.keys(entities).forEach( key => res.write(key + '<br>') );

    res.write('<p> Формат запроса GET /entity/{key} </p> <br>');
    res.write('<p> ex: GET 91.240.87.153/admin/entity/ent_services </p> <br>');
    res.end();

});

let container = express.Router();
container.get('/', cors(), getContainersList);
container.get('/:name', cors(), getContainer);
container.get('/:name/:cid', cors(), getContainer);
container.post('/:name/:cid', cors(), jsonparser, saveContainerHandler);
container.delete('/:name/:cid', cors(), deleteContainerHandler);

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

// функция возвращающая список существующих в системе контейнеров
function getContainersList(req, res, next){
    res.send(Object.keys( containers ).map(k => containers[k]));
}

// функция возвращающая объекты контейнера по имени
function getContainer(req, res, next){
    console.log('getContainer', req.params);
    if(!req.params.name) {
        res.status(500);
        res.end(JSON.stringify({error: 'ошибка доступа : не указан контейнер'}));
        console.warn('ошибка доступа : не указан контейнер');
            
        return;
    }
    let name = req.params.name;
    if( !!containers[name] && 
        (
            !!containers[name].db_entity    && 
            !!containers[name].db_links     &&
            !!containers[name].db_list
        )){

        let containerParams = containers[name];
        let cid = req.params.cid;

        const whereStr = cid ? `WHERE \`id\`=${ cid }` : '';

        console.log('Запрошенный контейнер существует:', containerParams);

        const q = 'SELECT * FROM `' + containerParams.db_list + '`' + whereStr;

        pool.query(q, (err, result) => {
            if(err){
                res.status(500);
                res.send(err);
                return;
            }
            
            result.forEach( r => {
                if(!r.id) return;

                r.q = new Promise((resolve, reject) => {
                    const id = r.id;
                    const qi = `SELECT \`${containerParams.db_links}\`.*, 
                                \`${containerParams.db_entity}\`.\`id\` as \`eid\`, 
                                ${containerParams.entity_fields.map(f => `\`${containerParams.db_entity}\`.\`${f}\``).join(', ')} 
                                FROM \`${containerParams.db_links}\`
                                LEFT JOIN \`${containerParams.db_entity}\` 
                                ON \`${containerParams.db_links}\`.\`${containerParams.container_id_key}\` = \`${containerParams.db_entity}\`.\`id\`
                                WHERE \`${containerParams.db_links}\`.\`container_id\`=${id}`;

                    console.log('qi: ', qi);
                    pool.query(qi, (err_i, result_i) => {
                        if(err){
                            reject(err_i);
                        }

                        resolve(result_i);
                    });

                });

                r.q.then( (items) => {
                    
                    items.forEach( item => {
                        item.entity = {};

                        containerParams.entity_fields.forEach( field => {
                            item.entity[field] = item[field];
                            item.entity['id'] = item['eid'];
                            delete item[field];
                        });
                    });

                    r.items = items;
                    console.log('entity: ', r);
                } );
                
            });

            Promise.all(result.map(ri => ri.q)).then(() => {
                res.send(result);
            });
        });
    } else {
        res.status(500);
        res.send(JSON.stringify({error: 'ошибка доступа : Запрошенный контейнер не существует'}));
        console.warn('ошибка доступа : Запрошенный контейнер не существует');
    }
}

function simpleSaveContainer(containerParams, id_container, ids){
    //проверка валидности ключа сущности для контейнера
    return new Promise(( resolve, reject )=>{
        if(containerParams && id_container && Array.isArray(ids) ){

            const id_key = containerParams.container_id_key;
            const links_db = containerParams.db_links;

            // delete exist container store and write new

            console.log("DEV containerParams:", containerParams);
            removeContainerItems( containerParams.name, id_container )
                .then((result)=>{
                    console.log(result);
                    let promisesList = ids.map(cur_id => {
                        return new Promise((rs, rj) => {
                            let q = `INSERT INTO \`${links_db}\` (\`container_id\`, \`${id_key}\` ) VALUES(${id_container}, ${cur_id})`;
                            console.log('q:', q);
                            pool.query(q, function(err, result){
                                if(err) {
                                    rj({error: err});
                                }
                                rs('запись о контейнере с id ', cur_id, 'добавлена в БД');
                                console.log('запись о контейнере с id ', cur_id, 'добавлена в БД');
                            })
                        });
                    });
        
                    Promise.all(promisesList).then((result)=>{
                        resolve('все записи по контейнеру сохранены в БД');
                    }).catch((error)=>{
                        reject(error);
                    })
                }).catch(err => reject(err));
 
        } else reject({error: 'Недостаточно входных данных для работы с контейнером(links_db && id_container && Array.isArray(ids))'});
    });
    
} 

function saveContainerHandler(req, res, next){
    console.log(req.body, req.params);
    //проверка валидности ключа сущности для контейнера
    if( !!containers[req.params.name] ){
        let containerParams = containers[req.params.name];
        const container_id = req.params.cid;
        const data = req.body;
        if(data.ids) {
            simpleSaveContainer(containerParams, container_id, data.ids).then((result) => {
                console.log(result);
                res.send({status: result});
            }).catch((error) => {
                console.error(error);
                res.status(500);
                res.send({error: JSON.stringify(error)});
            });
        }
    } else{
        res.status(500);
        res.send({error: 'Контейнер не найден'});
    }
}

function removeContainerFromRepo(name, id){
    return new Promise((resolve, reject) => {

        if( !!containers[name] ){
            let containerParams = containers[name];
            const db_repo = containerParams.db_list;
            const qd = `DELETE FROM \`${ db_repo }\` WHERE id=${id}`;
    
            pool.query(qd, (err, result)=> {
                if(err) {
                    reject({error: err});
                    return;
                }

                resolve('Контейнер с name: ' + name + ' и id: ' + id + ' удален из репозитория');
            });
        } else reject({error: 'Удаляемый контейнер не найден'});
    });
}
function removeContainerItems( name, id ){
    return new Promise((resolve, reject) => {
        //проверка валидности ключа сущности для контейнера
        if( !!containers[name] ){

            let containerParams = containers[name];
            const db_cont = containerParams.db_links;

            //  удаляем связив блоке контейнеров
            let qdd = `DELETE FROM \`${ db_cont }\` WHERE container_id=${id}`;

            pool.query(qdd, (err, result)=>{
                if(err) {
                    reject({error: err});
                    return;
                }
                resolve({result:`Записи контейнеров с id = ${id} удалены`});
            });
        } else reject('Контейнер не найден');
    });
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
            calc.forEach(c => delete data[c.key]);

            if( !reqKeys.every(r => !!data[r.key]) ) {
                res.end('не полные данные в запросе');
                return;
            }

            if( !Object.keys(data).every(r => !!fields.find(f => f.key === r ))) {
                res.end('в запросе присутствут неизвестные поля');
                return;
            }

            let valArr = Object.keys(data).map(datakey => {
                const targetReq = fields.find(r => r.key === datakey);
                if(!targetReq) return `"${data[datakey]}"`;
                return targetReq.type === 'string' || targetReq.type === 'text' ? `"${data[datakey]}"` : data[datakey];
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

function deleteContainerHandler(req, res){
    if( req.params.cid && req.params.name ){

        console.log('delete params:', req.params);
        //проверка наличия сущности в системе
        /**
         * Поправить запрос чтобы работал с эндпоинта DELETE /containername/id без передачи body
         */
        const id = req.params.cid;
        const name = req.params.name;


        let promiseLinks = removeContainerItems( name, id );
        let promiseRepo =  removeContainerFromRepo( name, id );

        Promise.all( [promiseLinks, promiseRepo] )
            .then((result) => res.send({status: 'Данные о контейнере '+ id + ' удалены'}))
            .catch((err) => {
                res.status(500);
                res.send({error: err.error});
            })

    }
}


entity.get('/:id/filters', cors(), function(req, res){
    if( !!entities[req.params.id] && !!entities[req.params.id].filters ){
        res.send( JSON.stringify( entities[req.params.id].filters ) )
    } else {
        res.send([]);
    }
});

entity.get('/:id/set', cors(), function(req, res){
    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
        pool.query(`SELECT * FROM \`${ entities[req.params.id].db_name }\``, (err, result)=> {
            const lenSet = result && result.length;
            const con = entities[req.params.id].container || null
            res.send({
                total: lenSet,
                fields: entities[req.params.id].fields  || [],
                container: con ? containers[con] : null,
            });
        });
    } else {
        res.send([]);
    }
});

entity.get('/:id', cors(), function(req, res){
    //res.send( JSON.stringify( req.query ) );
    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){

        const db = entities[req.params.id].db_name;
        const fields = entities[req.params.id].fields;
        const calc = entities[req.params.id].calculated;
        
        let limit = !!req.query.skip && Number(req.query.skip)  || '20';
        
        // проработать логику поиска типа поля запроса

        let searchParamsKeys = Object.keys(req.query).filter(k => 
                !( k === 'skip' || k === 'limit' ) && 
                ( fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'id' )
            );

        let searchParamsValue = searchParamsKeys.map( k => req.query[k] );

        let conSearchParams = concatFn( searchParamsKeys, searchParamsValue );

        let searchStringKeys = Object.keys(req.query).filter(k => 
                !( k === 'skip' || k === 'limit' ) && 
                ( fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'string' ) 
            );

        let searchStringValue = searchStringKeys.map(k => `${req.query[k]}` );
        let conSearchStrings = concatLikeFn( searchStringKeys, searchStringValue );

        console.log('ent q:', req.query, 'ids:', searchParamsKeys, searchParamsValue, 'str:', searchStringKeys, searchStringValue);

        // если спросили что то лишнее хотя с новой логикой сюда не попадуть те запросы которых нет в репозитории доступных
        if( !Object.keys(req.query).every(r => !!( r === 'skip' || r === 'limit' ) || !!fields.find(f => f.key === r ))) {
            res.status(500);
            res.end('в запросе поиска присутствуют неизвестные поля');
            console.warn('в запросе поиска присутствуют неизвестные поля');
            return;
        }

        let likeStr = conSearchStrings.length && conSearchStrings.join(' AND ');
        let whereStr = conSearchParams.length && conSearchParams.join(' AND ');

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;

        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : ''} ${likeStr ? (whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} ${limstr}`;

        console.log('q:', q);

        pool.query(q, (err, result)=> {

            if( calc ){
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
                                Object.assign( c, {[r.key]: r.value} );
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
            } else{
                res.send(result);
            }
            
        });
    } else {
        res.send([]);
    }
});

entity.delete('/:id', cors(), jsonparser, deleteEntity, function(req, res){
    res.end('delete done');
});

entity.post('/:id', cors(), jsonparser, createEntity, function(req, res){
    res.end('post done');
});

admin.use('/dict', dict);
admin.use('/entity', cors(), entity);
admin.use('/containers', cors(), container);

module.exports = admin;
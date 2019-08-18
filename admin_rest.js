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

function saveContainer(name, id_container, ids){
    //проверка валидности ключа сущности для контейнера
    if( !!containers[name] && (!!containers[name].db_name && !!containers[name].db_repo_name && !!containers[name].db_container_name) ){
        let containerParams = containers[name];

    }
} 

function removeContainerItems(name, id, res){
    //проверка валидности ключа сущности для контейнера
    if( !!containers[name] && (!!containers[name].db_name && !!containers[name].db_repo_name && !!containers[name].db_container_name) ){
        let containerParams = containers[name];
        const db_repo = containerParams.db_repo_name;
        const db_cont = containerParams.db_container_name;

        const qd = `DELETE FROM \`${ db_repo }\` WHERE id=${id}`;

        pool.query(qd, (err, result)=> {
            if(err) {
                res.status(500);
                res.send(err);
                return;
            }
            //  удаляем остатки для очистки мусора
            let qdd = `DELETE FROM \`${ db_cont }\` WHERE container_id=${id}`;

            pool.query(qdd, (err, result)=>{
                if(err) {
                    res.status(500);
                    res.send(err);
                    return;
                }

                res.send(JSON.stringify({
                    result,
                    text:`Записи контейнеров с id = ${id} удалены`
                }));

                next();
            })
        });
    }
}

function createEntity(req, res, next){
    console.log('post middle', req.body);
    if( req.body ){
        //проверка наличия сущности в системе
        if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
            const db = entities[req.params.id].db_name;
            const reqKeys = entities[req.params.id].fields.filter(f => !!f.required);
            const fields = entities[req.params.id].fields;
            const data = req.body;

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

function deleteContainerEntity(req, res, next){
    console.log('delete container middle', req.body);
    if( req.body ){
        //проверка наличия сущности в системе
        const id = req.body.id;
        const name = req.params.id;

        removeContainerItems( name, id, res );

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
            res.send(result);
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
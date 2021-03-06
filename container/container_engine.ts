import express from "express";
import bodyparser from 'body-parser';
const jsonparser = bodyparser.json();
const pool = require('../db/sql');
const containers = require('../container/container_repo');

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
                                rs('запись о контейнере с id ' + cur_id + ' добавлена в БД');
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


const container = express.Router();
container.get('/', getContainersList);
container.get('/:name', getContainer);
container.get('/:name/:cid', getContainer);
container.post('/:name/:cid', jsonparser, saveContainerHandler);
container.delete('/:name/:cid', deleteContainerHandler);

module.exports = container;

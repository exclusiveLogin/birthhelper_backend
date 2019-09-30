const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json();
const pool = require('./sql');
const slots = require('./slot_repo');

// функция возвращающая список существующих в системе контейнеров
function getSlotList(req, res, next){
    res.send(Object.keys( slots ).map(k => slots[k]));
}

// получение entity или контейнера слота
function getSlotItem(){

}

// функция возвращающая слот по id
function getSlot(req, res, next){
    console.log('getContainer', req.params);
    if(!req.params.name) {
        res.status(500);
        res.end(JSON.stringify({error: 'ошибка доступа : не указан slot'}));
        console.warn('ошибка доступа : не указан slot');
            
        return;
    }
    let name = req.params.name;
    if( !!slots[name] && 
        ( !!slots[name].db_entity && !!slots[name].db_links )){

        let slotParams = slots[name];
        let cid = req.params.cid;

        const whereStr = cid ? `WHERE \`id\`=${ cid }` : '';

        console.log('Запрошенный slot существует:', slotParams);

        const q = 'SELECT * FROM `' + slotParams.db_links + '`' + whereStr;

        pool.query(q, (err, result) => {
            if(err){
                res.status(500);
                res.send(err);
                return;
            }
            
            result.forEach( r => {
                if(!r.id) return;

                
                r.queryContainerRepo = new Promise((resolve, reject) => {
                    let qr;
                    if(r.type === 'container'){
                        qr = `SELECT 
                        \`${slotParams.db_repo}\`.\`id\`,
                        ${slotParams.container_fields.map(f => `\`${slotParams.db_repo}\`.\`${f}\``).join(', ')} 
                        FROM \`${slotParams.db_repo}\`
                        WHERE \`${slotParams.db_repo}\`.\`id\`=${r[slotParams.entity_id_key]}`;
                    }
                    
    
                    console.log('query repo: ', qr);

                    if(qr) {
                        pool.query(qr, (err_i, result_i) => {
                        if(err){
                            reject(err_i);
                        }

                        resolve(result_i);
                        });
                    } else resolve(null);
                    

                });

                r.queryContainerRepo.then(resultRepo => {
                    r.container = resultRepo;
                })

              
                
                r.q = new Promise((resolve, reject) => {
                    const id = r.id;
                    let qi = null;
                    switch(r.type){
                        case 'entity':
                            qi = `SELECT 'id',
                                ${slotParams.entity_fields.map(f => `\`${slotParams.db_entity}\`.\`${f}\``).join(', ')} 
                                FROM \`${slotParams.db_entity}\`
                                WHERE \`id\`= ${r[slotParams.entity_id_key]}`;
                                break;
                        case 'container':
                            qi = `SELECT 
                                \`${slotParams.db_entity}\`.\`id\`,
                                ${slotParams.entity_fields.map(f => `\`${slotParams.db_entity}\`.\`${f}\``).join(', ')} 
                                FROM \`${slotParams.db_container}\`
                                LEFT JOIN \`${slotParams.db_entity}\`
                                ON \`${slotParams.db_container}\`.\`${slotParams.entity_id_key}\` = \`${slotParams.db_entity}\`.\`id\`
                                WHERE \`${slotParams.db_container}\`.\`container_id\`=${r[slotParams.entity_id_key]}`;
                                break;
                    }

                    console.log('qi: ', qi);
                    if(qi){
                        pool.query(qi, (err_i, result_i) => {
                            if(err){
                                reject(err_i);
                            }

                            resolve(result_i);
                        });
                    } else resolve(null);
                    

                });

                r.q.then( (ent) => {
                    r.entities = [...ent];
                    console.log('entity: ', r);
                } );
                
            });

            let prs = [];
            result.forEach(ri => prs.push(...[ri.q, ri.queryContainerRepo]));

            console.log('prs: ', prs);
            Promise.all(prs).then(() => {
                res.send(result);
            });
        });
    } else {
        res.status(500);
        res.send(JSON.stringify({error: 'ошибка доступа : Запрошенный slot не существует'}));
        console.warn('ошибка доступа : Запрошенный slot не существует');
    }
}

function saveSlotHandler(req, res, next){
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

function removeSlot(name, id){
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

function deleteSlotHandler(req, res){
    if( req.params.cid && req.params.name ){

        console.log('delete params:', req.params);
        //проверка наличия сущности в системе
        /**
         * Поправить запрос чтобы работал с эндпоинта DELETE /containername/id без передачи body
         */
        const id = req.params.cid;
        const name = req.params.name;

        let promiseSlot = removeSlot( name, id );

        Promise.all( [promiseSlot] )
            .then((result) => res.send({status: 'Данные о контейнере '+ id + ' удалены'}))
            .catch((err) => {
                res.status(500);
                res.send({error: err.error});
            })

    }
}


const slot = express.Router();
slot.get('/', cors(), getSlotList);
slot.get('/:name', cors(), getSlot);
// container.get('/:name/:cid', cors(), getContainer);
// container.post('/:name/:cid', cors(), jsonparser, saveContainerHandler);
// container.delete('/:name/:cid', cors(), deleteContainerHandler);

module.exports = slot;
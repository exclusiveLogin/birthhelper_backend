import * as express from "express";
import bodyParser from "body-parser";
const jsonparser = bodyParser.json();
const pool = require('../db/sql');
const slots = require('../slot/slot_repo');

// функция возвращающая список существующих в системе контейнеров
function getSlotList(req, res, next){
    res.send(Object.keys( slots ).map(k => slots[k]));
}

// получение entity или контейнера слота
function getSlotItems(slotParams, r){
    return new Promise((resolve, reject) => {
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
                if(err_i){
                    reject(err_i);
                }

                resolve(result_i);
            });
        } else resolve(null);
        

    });
}

function getSlotContainer( slotParams, r ){
    return new Promise((resolve, reject) => {
        let qr;
        if(r.type === 'container'){
            qr = `SELECT 
            \`${slotParams.db_repo}\`.\`id\`,
            ${slotParams.container_fields.map(f => `\`${slotParams.db_repo}\`.\`${f}\``).join(', ')} 
            FROM \`${slotParams.db_repo}\`
            WHERE \`${slotParams.db_repo}\`.\`id\`=${r[slotParams.entity_id_key]}`;
        } 

        console.log('query getSlotContainer: ', qr);

        if(qr) {
            pool.query(qr, (err_i, result_i) => {
            if(err_i){
                reject(err_i);
            }

            resolve(result_i);
            });
        } else resolve(null);
        
    });
}

// функция возвращающая слот по id
function getSlot(req, res, next){
    console.log('getSlot', req.params);
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

                r.queryContainerRepo = getSlotContainer(slotParams, r);

                r.queryContainerRepo.then(resultRepo => {
                    r.container = resultRepo;
                })
                
                r.q = getSlotItems(slotParams, r);

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

function saveSlot(params, slot_id, data){

    console.log('save slot:', params, slot_id, data);

    const db = params.db_links;
    let valArr = !slot_id ?
        Object.keys(data).map( datakey => {
            const targetType = params.required_fields_type && params.required_fields_type[datakey];
            if(!targetType) return `"${data[datakey]}"`;
            return targetType === 'string' ? `"${data[datakey]}"` : data[datakey];
    }) :
        Object.keys(data).map( datakey => {
            const targetType = params.required_fields_type && params.required_fields_type[datakey];
            if(!targetType) return `"${data[datakey]}"`;
            return targetType === 'string' ? `\`${ datakey }\` = "${data[datakey]}"` : `\`${ datakey }\` = ${ data[ datakey ] }`;
    });

    console.log('valArr: ', valArr, 'slot_id: ', slot_id);

    let q = !slot_id ?
        `INSERT INTO \`${ db }\` (\`${ Object.keys(data).join('\`, \`') }\`) VALUES ( ${ valArr.join(',') } )` :
        `UPDATE \`${ db }\` SET ${ valArr.join(', ') } WHERE \`id\` = ${slot_id}` ;

    console.log('q: ', q);

    return new Promise((rs, rj) => {
        pool.query(q, function(err, result){
            if(err) {
                rj({error: err});
            }
            rs(`${slot_id ? 'слот с id ' + slot_id + ' изменен' : 'добавлен новый слот'}`);
            console.log(`${slot_id ? 'слот с id ' + slot_id + ' изменен' : 'добавлен новый слот'}`);
        })
    });
}

function saveSlotHandler(req, res, next){
    console.log(req.body, req.params);
    //проверка валидности ключа сущности для контейнера
    if( !!slots[req.params.name] ){
        let slotParams = slots[req.params.name];
        const slot_id = req.params.sid;
        const data = req.body;

        if(data &&
            validator(data, slotParams)
        ) {
            saveSlot(slotParams, slot_id, data).then((result) => {
                console.log(result);
                res.send({status: result});
            }).catch((error) => {
                console.error(error);
                res.status(500);
                res.send({error: JSON.stringify(error)});
            });
        } else {
            res.status(500);
            res.send({error: 'Ошибка в переданных данных, уточните запрос'});
        }
    } else{
        res.status(500);
        res.send({error: 'Контейнер не найден'});
    }
}

function validator(data, params){ // все ли поля необходимые пришли на бек
    console.log('validator: ', data, params.required_fields);
    const reqFields = params.required_fields;
    return reqFields.every(rf => !!data[rf]);
}

function removeSlot(params, id){
    return new Promise((resolve, reject) => {
        const db_repo = params.db_links;
        const qd = `DELETE FROM \`${ db_repo }\` WHERE id=${id}`;
        console.log('qd: ', qd);

        pool.query(qd, (err, result)=> {
            if(err) {
                reject({error: err});
                return;
            }

            resolve('Слот с name: ' + params.name + ' и id: ' + id + ' удален из репозитория');
        });
    });
}

function deleteSlotHandler(req, res){
    if( req.params.sid && req.params.name ){
        console.log('delete params:', req.params);
        const id = req.params.sid;
        const name = req.params.name;

        if( !!slots[ name ] ){
            let slotParams = slots[name];
            removeSlot( slotParams, id )
                .then(result => {
                    res.send({status: result})
            })
                .catch( error => {
                    res.status(500);
                    res.send({error: error.error});
            });

        } else {
            res.status(500);
            res.send({error: 'слот не найден'});
        }
    }
}


const slot = express.Router();
slot.get('/', getSlotList);
slot.get('/:name', getSlot);
slot.post('/:name/', jsonparser, saveSlotHandler);
slot.post('/:name/:sid', jsonparser, saveSlotHandler);
slot.delete('/:name/:sid', deleteSlotHandler);

module.exports = slot;

let express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json();
const entities = require('./entity_repo');
const pool = require('./sql');
const containers = require('./container_repo');

const entity = express.Router();
entity.get('/', cors(), function(req, res){
    res.set('Content-Type', 'text/html'); 
    res.write('Эндпоинт для сущностей доступны следующие: <br>');
    Object.keys(entities).forEach( key => res.write(key + '<br>') );

    res.write('<p> Формат запроса GET /entity/{key} </p> <br>');
    res.write('<p> ex: GET 91.240.87.153/admin/entity/ent_services </p> <br>');
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
                links: entities[req.params.id].links  || [],
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

module.exports = entity;
let express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json();

let app = express();
let mysql = require('mysql');
let host = process.env.HOST || 'localhost';
let pool = mysql.createPool({
    connectionLimit: 100,
    host: host,
    user: 'birthhelper',
    password: 'q1w2e3r4t5y',
    database: 'birthhelper'
})

const dicts = {
    dict_category_service: { db: 'category_service' },
    dict_trimester_service: { db: 'trimester' },
    dict_clinics: { db: 'clinics' },
    dict_district: { db: 'district' },
    dict_address_id: { 
        db: 'address_container',
        titleMap: [
            'address_str'
        ],
        titleAddMap: [
            'position_lat',
            'position_lon'
        ]
    },
    dict_phone_container: { db: 'phone_container' }
};

const entities = {
    ent_services: {
        db_name: 'services',
        filters: [
            {
                name: 'title',
                title: 'Название услуги',
                type: 'string',
            },
            {
                name: 'category',
                title: 'Категория услуги',
                type: 'id',
                db_name: 'dict_category_service'
            },
        ],
        fields:[ 
            { key: 'id', title: 'ID услуги', type: 'id', readonly: true }, 
            { key: 'title', type: 'string', title: 'Название услуги', required: true }, 
            { 
                key: 'category', 
                title: 'Категория услуги', 
                dctKey: 'dict_category_service', 
                type: 'id', 
                useDict: true, 
                canBeNull: false, 
                initData: 1, 
                required: true 
            }, 
            { key: 'description', title: 'Описание услуги', type: 'text' }, 
            { key: 'article_id', type: 'id', hide: true }, 
            { key: 'gallery_id', type: 'id', hide: true }, 
            { 
                key: 'trimester', 
                type: 'id', 
                title: 'Триместер услуги', 
                useDict: true,
                dctKey: 'dict_trimester_service',
                canBeNull: true 
            }, 
            { key: 'type', type: 'id', hide: true  }, 
        ]
    },
    ent_clinics: {
        db_name: 'clinics',
        filters: [],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true }, 
            { key: 'title', type: 'string', title: 'Название клиники', required: true }, 
            // { 
            //     key: 'phone_container_id', 
            //     title: 'Телефоны клиники', 
            //     dctKey: 'dict_phone_container_id', 
            //     type: 'id', 
            //     useDict: true, 
            //     canBeNull: true
            // }, 
            { key: 'description', title: 'Описание клиники', type: 'text' },
            { 
                key: 'address_id', 
                title: 'Адресс клиники', 
                dctKey: 'dict_address_id', 
                type: 'id', 
                useDict: true, 
                canBeNull: false,
                required: true 
            }, 
            { 
                key: 'address_id2', 
                title: 'Адресс клиники', 
                dctKey: 'dict_address_id', 
                type: 'autocomplete', 
                useDict: true, 
                canBeNull: false,
                required: true 
            }, 
        ]
    },
    ent_districts: { 
        db_name: 'districts',
        filters: [],
        fields: [
            
        ]
    },
};

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
            res.send(JSON.stringify({
                total: lenSet,
                fields: entities[req.params.id].fields || []
            }));
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
        
        let limit = !!req.query.skip && !!Number(req.query.skip)  || '20';
        
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

        let whereStr = conSearchStrings.length && conSearchStrings.join(' AND ');
        let likeStr = conSearchParams.length && conSearchParams.join(' AND ');

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ db }\` ${whereStr ? 'WHERE ' + whereStr : ''} ${likeStr ? ' AND ' + likeStr : ''} ${limstr}`;

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

app.use('/admin', admin);


app.get('/', function(req, res){
    res.send('hello world');
});

app.get('/districts', function(req, res){
    pool.query('SELECT * FROM `district`', (err, result)=> {
        res.send(result);
    })
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
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
    dict_category_service: 'category_service',
    dict_trimester_service: 'trimester',
    dict_clinics: 'clinics',
    dict_district: 'district'
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
            { key: 'id', type: 'id' }, 
            { key: 'title', type: 'string', required: true }, 
            { key: 'category', type: 'id', required: true }, 
            { key: 'description', type: 'string' }, 
            { key: 'article_id', type: 'id' }, 
            { key: 'gallery_id', type: 'id' }, 
            { key: 'trimester', type: 'id' }, 
            { key: 'type', type: 'id' }, 
        ]
    },
    ent_clinics: {
        db_name: 'clinics',
        filters: []
    },
    ent_districts: { 
        db_name: 'districts',
        filters: []
    },
};

let admin = express.Router();
admin.get('/', function(req, res){
    res.send('HELLO DICT ROOT');
});

let dict = express.Router();
dict.get('/:id', cors(), function(req, res){
    if(!!dicts[req.params.id]){

        let limit = !!req.query.skip && Number(req.query.skip)  || '20';

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ dicts[req.params.id] }\` ${limstr}`;


        //console.log('dict:', req.params.id, limstr, q);
        pool.query(q, (err, result)=> {
            //console.log("dicts:", result);
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
                return targetReq.type === 'string' ? `"${data[datakey]}"` : data[datakey];
            });

            let existArr = concatFn( Object.keys(data), valArr );
            //console.log('existArr: ', existArr);

            const q = `INSERT INTO \`${ db }\` (\`${ Object.keys(data).join('\`, \`') }\`) VALUES ( ${ valArr.join(',') } )`;
            const qi = existArr.join(', ');
            //console.log('q: ', q, 'qi:', qi);


            pool.query(q + ' ON DUPLICATE KEY UPDATE ' + qi, (err, result)=> {
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
                total: lenSet
            }));
        });
    } else {
        res.send([]);
    }
});

entity.get('/:id', cors(), function(req, res){
    //res.send( JSON.stringify( req.query ) );
    if( !!entities[req.params.id] && !!entities[req.params.id].db_name ){
        

        let limit = !!req.query.skip && Number(req.query.skip)  || '20';

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ entities[req.params.id].db_name }\` ${limstr}`;


        //console.log('ent:', limstr, q);
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
let express = require('express');
const cors = require('cors');
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
                name: 'category',
                title: 'Категория услуги',
                type: 'id',
            },
            {
                name: 'title',
                title: 'Название услуги',
                type: 'string',
            },
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
        pool.query(`SELECT * FROM \`${ dicts[req.params.id] }\``, (err, result)=> {
            res.send(result);
        });
    } else {
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


        console.log(limstr, q);
        pool.query(q, (err, result)=> {
            res.send(result);
        });
    } else {
        res.send([]);
    }
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
let express = require('express');
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
    ent_services: 'services',
    ent_clinics: 'clinics',
    ent_districts: 'districts',
};

let admin = express.Router();
admin.get('/', function(req, res){
    res.send('HELLO DICT ROOT');
});

let dict = express.Router();
dict.get('/:id', function(req, res){
    if(!!dicts[req.params.id]){
        pool.query(`SELECT * FROM \`${ dicts[req.params.id] }\``, (err, result)=> {
            res.send(result);
        });
    } else {
        res.send([]);
    }
});

let entity = express.Router();
entity.get('/', function(req, res){
    res.set('Content-Type', 'text/html'); 
    res.write('Эндпоинт для сущностей доступны следующие: <br>');
    Object.keys(entities).forEach( key => res.write(key + '<br>') );

    res.write('<p> Формат запроса GET /entity/{key} </p> <br>');
    res.write('<p> ex: GET 91.240.87.153/admin/entity/ent_services </p> <br>');
    res.end();

});

entity.get('/:id', function(req, res){
    if(!!entities[req.params.id]){
        pool.query(`SELECT * FROM \`${ entities[req.params.id] }\``, (err, result)=> {
            res.send(result);
        });
    } else {
        res.send([]);
    }
});

admin.use('/dict', dict);
admin.use('/entity', entity);

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
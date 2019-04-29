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

admin.use('/dict', dict);

app.use('/admin', admin);


app.get('/', function(req, res){
    res.send('hello world');
});

app.get('/districts', function(req, res){
    pool.query('SELECT * FROM `district`', (err, result)=> {
        res.send(result);
    })
});

app.listen(80, function () {
    console.log('Example app listening on port 3000!');
  });
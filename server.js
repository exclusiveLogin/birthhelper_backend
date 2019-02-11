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
let test = express.Router();
test.get('/', function(req, res){
    console.log('test root');
    res.send('WELCOME to TEST');
});

test.get('/:id', function(req, res){
    console.log('test root');
    res.send('WELCOME to TEST id ' + req.params.id);
});

test.get('/:id/:x/:y/:z/start', function(req, res){
    console.log('test/start root id:', req.params.id);
    res.json( req.params );
});

app.get('/', function(req, res){
    res.send('hello world');
});

app.get('/districts', function(req, res){
    pool.query('SELECT * FROM `district`', (err, result)=> {
        res.send(result);
    })
});

app.use('/test', test);

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
let express = require('express');
const admin = require('./admin_rest');

let app = express();

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
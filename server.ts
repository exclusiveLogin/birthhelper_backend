import express from 'express';
const admin = require('./admin_rest');
import fs from 'fs';

let app = express();

app.use('/admin', admin);
app.use('/static', express.static('uploads/',{ fallthrough: false }), (err, req, res, next) => {
    console.log('err static:', err);
    if(err.status === 404){
        console.log('Error 404 отдаем заглушку');
        fs.createReadStream('assets/noimage.png').pipe(res);
    }
});

// app.get('/', function(req, res){
//     res.send('hello world');
// });

// app.get('/districts', function(req, res){
//     pool.query('SELECT * FROM `district`', (err, result)=> {
//         res.send(result);
//     })
// });

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });

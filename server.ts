import express from 'express';
const admin = require('./admin_rest');
const api = require('./api_rest');
const dict = require('./dictionary_engine');
import fs from 'fs';

let app = express();

app.use('/admin', admin);
app.use('/api', api);
app.use('/dict', dict);
app.use('/static', express.static('/usr/src/app/uploads/',{ fallthrough: false }), (err, req, res, next) => {
    console.log('err static:', err);
    if(err.status === 404){
        console.log('Error 404 отдаем заглушку');
        fs.createReadStream('assets/noimage.png').pipe(res);
    }
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });

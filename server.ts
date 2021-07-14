import express from 'express';
import cors from 'cors';
const admin = require('./api/admin_rest');
const api = require('./api/api_rest');
import fs from 'fs';
import {CacheEngine} from "./cache.engine/cache_engine";
import {SearchEngine} from "./search.engine/engine";

// cache engine provider
const CE = new CacheEngine();
const SE = new SearchEngine();

let app = express();

app.use(cors());
app.use('/search', SE.getRouter(CE));
app.use('/admin', admin(CE));
app.use('/api', api(CE));
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

import express from "express";
import cors from 'cors';
const admin = require('./api/admin_rest');
const api = require('./api/api_rest');
import fs from 'fs';
import {CacheEngine} from "./cache.engine/cache_engine";
import {SearchEngine} from "./search.engine/engine";
import {DictionaryEngine} from "./dictionary/dictionary_engine";
import {Context} from "./search.engine/config";
import {AuthorizationEngine} from "./auth/auth.engine";

// providers
const CE = new CacheEngine();
const DE = new DictionaryEngine(CE);
const SE = new SearchEngine(CE, DE);
const AE = new AuthorizationEngine();

const context: Context = {
    cacheEngine: CE,
    searchEngine: SE,
    dictionaryEngine: DE,
    authorizationEngine: AE,
}

let app = express();

app.use(cors());
app.use('/search', SE.getRouter());
app.use('/admin', admin(context));
app.use('/api', api(context));
app.use('/auth', AE.getRouter());
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

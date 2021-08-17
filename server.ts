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
import {DataBaseService} from "./db/sql";
import {EntityEngine} from "./entity/entity_engine";
import {ContainerEngine} from "./container/container_engine";
import {SlotEngine} from "./slot/slot_engine";


// context
const context: Context = {
    cacheEngine: null,
    searchEngine: null,
    dictionaryEngine: null,
    authorizationEngine: null,
    dbe: null,
    entityEngine: null,
    entityEngineAdmin: null,
    containerEngine: null,
    slotEngine: null,
}

// providers
const CE = new CacheEngine(context);
const DBE = new DataBaseService(context);
const DE = new DictionaryEngine(context);
const SE = new SearchEngine(context);
const AE = new AuthorizationEngine(context);
const EE: EntityEngine = new EntityEngine(context);
const EEA: EntityEngine = new EntityEngine(context, true);
const CNE: ContainerEngine = new ContainerEngine(context);
const SLE: SlotEngine = new SlotEngine(context);

let app = express();
function jsonHeaders(req, res, next) {
    res.contentType('json');
    next();
}
app.use(cors(), jsonHeaders);
app.use('/search', context.searchEngine.getRouter());
app.use('/admin', admin(context));
app.use('/api', api(context));
app.use('/auth', context.authorizationEngine.getRouter());
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

import express, {Router} from 'express';
import {CacheEngine} from "../cache.engine/cache_engine";
import {DictionaryEngine} from "../dictionary/dictionary_engine";
const entity = require('../entity/entity_engine');
const container = require('../container/container_engine');
const slot = require('../slot/slot_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}

function getAdminMiddleware(_ce: CacheEngine, _de: DictionaryEngine): Router {

    admin.use('/dict', _de.getRouter(_ce));
    admin.use('/entity', entity(_ce));
    admin.use('/containers', container);
    admin.use('/slots', slot);

    return admin;
}

module.exports = getAdminMiddleware;

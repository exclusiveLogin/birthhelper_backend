import express, {Router} from 'express';
import {CacheEngine} from "../cache.engine/cache_engine";
const dict = require('../dictionary/dictionary_engine');
const entity = require('../entity/entity_engine');
const container = require('../container/container_engine');
const slot = require('../slot/slot_engine');

let ce: CacheEngine;

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}




function getAdminMiddleware(_: CacheEngine): Router {
    ce = _;

    admin.use('/dict', dict(ce));
    admin.use('/entity', entity(ce));
    admin.use('/containers', container);
    admin.use('/slots', slot);

    return admin;
}

module.exports = getAdminMiddleware;

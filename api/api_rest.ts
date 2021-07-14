import express, {Router} from 'express';
const dict = require('../dictionary/dictionary_engine');
const entity = require('../entity/entity_engine');
const filter = require('../filter/filter_engine');
import {CacheEngine} from "../cache.engine/cache_engine";

let ce: CacheEngine;

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

function getAPIMiddleware(_: CacheEngine): Router {
    ce = _;
    api.use('/filter', filter);
    api.use('/dict', dict(ce));
    api.use('/', entity(ce));
    return api;
}

module.exports = getAPIMiddleware;

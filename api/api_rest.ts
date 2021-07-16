import {Router} from 'express';
import * as express from "express";
const dict = require('../dictionary/dictionary_engine');
const entity = require('../entity/entity_engine');
const filter = require('../filter/filter_engine');
import {CacheEngine} from "../cache.engine/cache_engine";
import {DictionaryEngine} from "../dictionary/dictionary_engine";

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

function getAPIMiddleware(_ce: CacheEngine, _de: DictionaryEngine): Router {
    api.use('/filter', filter);
    api.use('/dict', _de.getRouter(_ce));
    api.use('/', entity(_ce));
    return api;
}

module.exports = getAPIMiddleware;

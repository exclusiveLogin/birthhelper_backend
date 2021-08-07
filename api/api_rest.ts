import {Router} from 'express';
import * as express from "express";
const entity = require('../entity/entity_engine');
const filter = require('../filter/filter_engine');
import {Context} from "../search.engine/config";

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

function getAPIMiddleware(context: Context): Router {
    api.use('/filter', filter);
    api.use('/dict', context.dictionaryEngine.getRouter(context.cacheEngine));
    api.use('/', entity(context.cacheEngine, context.searchEngine));
    return api;
}

module.exports = getAPIMiddleware;

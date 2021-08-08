import {Router} from 'express';
import * as express from "express";
import {EntityEngine} from "../entity/entity_engine";

const filter = require('../filter/filter_engine');
import {Context} from "../search.engine/config";

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

function getAPIMiddleware(context: Context): Router {
    let EE: EntityEngine = new EntityEngine(context);
    api.use('/filter', filter);
    api.use('/dict', context.dictionaryEngine.getRouter(context.cacheEngine));
    api.use('/', EE.getRouter());
    return api;
}

module.exports = getAPIMiddleware;

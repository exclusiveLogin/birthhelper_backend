import {Router} from 'express';
import * as express from "express";

const filter = require('../filter/filter_engine');
import {Context} from "../search.engine/config";

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

function getAPIMiddleware(context: Context): Router {
    api.use('/filter', filter);
    api.use('/dict', context.dictionaryEngine.getRouter());
    api.use('/slots', context.slotEngine.getRouter());
    api.use('/', context.entityEngine.getRouter());
    return api;
}

module.exports = getAPIMiddleware;

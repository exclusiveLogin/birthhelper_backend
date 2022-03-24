import {Router} from 'express';
import * as express from "express";

import {Context} from "../search/config";

let api = express.Router();
api.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

export function getAPIMiddleware(context: Context): Router {
    api.use('/dict', context.dictionaryEngine.getRouter());
    api.use('/slots', context.slotEngine.getRouter());
    api.use('/containers', context.containerEngine.getRouter());
    api.use('/configurator', context.configEngine.getRouter());
    api.use('/cache', context.cacheEngine.getRouter());
    api.use('/', context.entityEngine.getRouter());
    return api;
}

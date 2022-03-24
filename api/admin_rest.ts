import {Router} from 'express';
import * as express from "express";
import {Context} from "../search/config";

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}

export function getAdminMiddleware(context: Context): Router {
    admin.use('/dict', context.dictionaryEngine.getRouter());
    admin.use('/entity', context.entityEngineAdmin.getRouter());
    admin.use('/containers', context.containerEngine.getRouter());
    admin.use('/slots', context.slotEngine.getRouter());
    admin.use('/cache', context.cacheEngine.getRouter());

    return admin;
}

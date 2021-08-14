import {Router} from 'express';
import * as express from "express";
import {Context} from "../search.engine/config";
const slot = require('../slot/slot_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}

function getAdminMiddleware(context: Context): Router {
    admin.use('/dict', context.dictionaryEngine.getRouter());
    admin.use('/entity', context.entityEngineAdmin.getRouter());
    admin.use('/containers', context.containerEngine.getRouter());
    admin.use('/slots', slot);

    return admin;
}

module.exports = getAdminMiddleware;

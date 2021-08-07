import {Router} from 'express';
import * as express from "express";
import {Context} from "../search.engine/config";
const entity = require('../entity/entity_engine');
const container = require('../container/container_engine');
const slot = require('../slot/slot_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}

function getAdminMiddleware(context: Context): Router {

    admin.use('/dict', context.dictionaryEngine.getRouter(context.cacheEngine));
    admin.use('/entity', entity(context.cacheEngine));
    admin.use('/containers', container);
    admin.use('/slots', slot);

    return admin;
}

module.exports = getAdminMiddleware;

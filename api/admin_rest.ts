import express from 'express';
const dict = require('../dictionary/dictionary_engine');
const entity = require('../entity/entity_engine');
const container = require('../container/container_engine');
const slot = require('../slot/slot_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send({index: 'admin root index'});
}


admin.use('/dict', dict);
admin.use('/entity', entity);
admin.use('/containers', container);
admin.use('/slots', slot);

module.exports = admin;

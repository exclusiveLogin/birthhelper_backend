import express from 'express';
const dict = require('./dictionary_engine');
const entity = require('./entity_engine');
const container = require('./container_engine');
const slot = require('./slot_engine');

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

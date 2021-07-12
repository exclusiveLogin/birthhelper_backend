import express from 'express';
const dict = require('../dictionary/dictionary_engine');
const entity = require('../entity/entity_engine');
const filter = require('../filter/filter_engine');

let admin = express.Router();
admin.get('/', apiRootHandler);

function apiRootHandler(req, res){
    res.send({index: 'api root index'});
}

admin.use('/filter', filter);
admin.use('/dict', dict);
admin.use('/', entity);

module.exports = admin;

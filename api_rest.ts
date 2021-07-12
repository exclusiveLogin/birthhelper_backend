import express from 'express';
const dict = require('./dictionary_engine');
const entity = require('./entity_engine');
const filter = require('./filter_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send('HELLO API ROOT');
}

admin.use('/filter', filter);
admin.use('/dict', dict);
admin.use('/', entity);

module.exports = admin;

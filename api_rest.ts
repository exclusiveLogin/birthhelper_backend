import express from 'express';
import cors from 'cors';

const dict = require('./dictionary_engine');
const entity = require('./entity_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send('HELLO API ROOT');
}



admin.use('/dict', dict);
admin.use('/', cors(), entity);

module.exports = admin;

let express = require('express');
const cors = require('cors');

const dict = require('./dictionary_engine');
const entity = require('./entity_engine');
const container = require('./container_engine');
const slot = require('./slot_engine');

let admin = express.Router();
admin.get('/', adminRootHandler);

function adminRootHandler(req, res){
    res.send('HELLO ADMIN ROOT');
}


admin.use('/dict', dict);
admin.use('/entity', cors(), entity);
admin.use('/containers', cors(), container);
admin.use('/slots', cors(), slot);

module.exports = admin;
import express = require('express');
const pool = require('./sql');
const filters = require('./filter_repo');

const filter = express.Router();

filter.get('/', function(req, res){
    res.send(`<p>Filter engine</p>`);
});

filter.get('/:id', function(req, res){
    if(!!filters[req.params.id]){
            const target = filters[req.params.id];
            res.send(target);
    } else {
        console.log('error', req.params);
        res.send([]);
    }
});

module.exports = filter;

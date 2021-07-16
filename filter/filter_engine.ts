import * as express from "express";
const pool = require('../db/sql');
const filters = require('../filter/filter_repo');

const filter = express.Router();

filter.get('/', function (req, res) {
    res.send({index: 'filter root index'});
});

filter.get('/:id', function (req, res) {
    if (!!filters[req.params.id]) {
        const target = filters[req.params.id];
        res.send(target);
    } else {
        console.log('error', req.params);
        res.status(500);
        res.send({error: 'Фильтров для данной секции не найдено', context: req.params});
    }
});

module.exports = filter;

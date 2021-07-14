import express = require('express');
import {CacheEngine} from "../cache.engine/cache_engine";
import {Router} from "express";
const pool = require('../db/sql');
const dicts = require('../dictionary/dictionary_repo');


let ce: CacheEngine;
const dict = express.Router();
dict.get('/:id', function(req, res){

    if(!!dicts[req.params.id]){

        const dict = dicts[req.params.id];

        let limit = (!!req.query.limit && !!Number(req.query.limit))  || '200';

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ dict.db }\` ${limstr}`;


        //console.log('dict:', req.params.id, limstr, q);
        pool.query(q, (err, result)=> {
            //console.log("dicts:", result);
            ce.saveCacheData(`dict_${req.params.id}`, result);

            if( dict.titleMap || dict.titleAddMap ){
                result && result.forEach( r => {
                    r.title = dict.titleMap.map(f => r[f]).join(', ');
                    r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                })
                

                //console.log('result:', result);
            }
            res.send(result);
        });

    } else {
        console.log('error', req.params);
        res.send([]);
    }
});

function getDictMiddleware(_: CacheEngine): Router {
    ce = _;
    return dict;
}

module.exports = getDictMiddleware;

let express = require('express');
const pool = require('./sql');
const dicts = require('./dict_repo');
const cors = require('cors');

const dict = express.Router();
dict.get('/:id', cors(), function(req, res){
    if(!!dicts[req.params.id]){

        const dict = dicts[req.params.id];

        let limit = (!!req.query.skip && !!Number(req.query.skip))  || '200';

        let limstr = `${ !!req.query.skip ? ' LIMIT ' + limit + ' OFFSET ' + req.query.skip  :'' }`;
        let q = `SELECT * FROM \`${ dict.db }\` ${limstr}`;


        //console.log('dict:', req.params.id, limstr, q);
        pool.query(q, (err, result)=> {
            //console.log("dicts:", result);

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

module.exports = dict;
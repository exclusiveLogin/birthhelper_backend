const express = require('express');
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
const pool = require('../db/sql');
const dicts = require('../dictionary/dictionary_repo');




export class DictionaryEngine {
    private dict = express.Router();

    constructor(private ce: CacheEngine) {}
    
    getDict(id: string, limit = '200', skip = '0'): Promise<any[]> {
        const dict = dicts[id];
        if(!dict) {
            return Promise.reject(`Словарь ${id} не найден`);
        }

        const fetchFromDB = new Promise<any[]>((resolve, rejects) => {
            let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;
            let q = `SELECT * FROM \`${ dict.db }\` ${limstr}`;

            pool.query(q, (err, result)=> {
                if (err){
                    rejects(err);
                    return;
                }

                this.ce.saveCacheData(`${id}`, result);

                if( dict.titleMap || dict.titleAddMap ){
                    result && result.forEach( r => {
                        r.title = dict.titleMap.map(f => r[f]).join(', ');
                        r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                    })
                }
                resolve(result);
            });
        });

        if(this.ce.checkCache(id)) {
            return this.ce.getCachedByKey(id).toPromise();
        } else {
            return fetchFromDB
        }
    }

    sendError = (res: Response, err): void => {
        res.status(500);
        res.end({err});
    }

    getRouter(_: CacheEngine): Router {
        this.ce = _;
        return this.dict.get('/:id', (req, res) => {

            const id = req.params.id;

            if (!!id) this.getDict(id)
                .then(data => res.send(data))
                .catch(error => this.sendError(res, error));
        });
    }
}

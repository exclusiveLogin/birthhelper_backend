import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
import {Observable, throwError} from "rxjs";
import {generateFilterQStr, generateQStr} from "../db/sql.helper";
const pool = require('../db/sql');
const dicts = require('../dictionary/dictionary_repo');


export interface DictionaryItem {
    id: number;
    title: string;
    description: string;
    icon?: string;
    bg_color?: string;
}

export class DictionaryEngine {
    private dict = express.Router();
    constructor(private ce: CacheEngine) {}

    getDict(id: string, limit = '200', skip = '0'): Observable<DictionaryItem[]> {
        const dict = dicts[id];
        if(!dict) {
            return throwError(`Словарь ${id} не найден`);
        }

        const fetchFromDB = new Observable<any[]>((subscriber) => {
            let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;

            let likeStr = [...generateFilterQStr(dict?.filters || [], 'string'), ...generateFilterQStr(dict?.filters || [], 'flag')].join(' AND ');
            let whereStr = [...generateFilterQStr(dict?.filters || [], 'id')].join(' AND ');

            let q =
                `SELECT * 
                FROM \`${ dict.db }\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

            pool.query(q, (err, result)=> {
                if (err){
                    subscriber.error(err);
                }

                this.ce.saveCacheData(`${id}`, result);

                if( dict.titleMap || dict.titleAddMap ){
                    result && result.forEach( r => {
                        r.title = dict.titleMap.map(f => r[f]).join(', ');
                        r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                    })
                }
                subscriber.next(result);
                subscriber.complete();
            });
        });

        if(this.ce.checkCache(id)) {
            return this.ce.getCachedByKey(id);
        } else {
            return fetchFromDB
        }
    }

    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end({err});
    }

    getRouter(_: CacheEngine): Router {
        this.ce = _;
        return this.dict.get('/:id', (req, res) => {

            const id = req.params.id;

            if (!!id) this.getDict(id).subscribe((data) => res.send(data),  error => this.sendError(res, error));
        });
    }
}

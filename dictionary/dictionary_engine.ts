import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
import {Observable, throwError} from "rxjs";
import {generateFilterQStr} from "../db/sql.helper";
import {DataBaseService} from "../db/sql";
import {Context} from "../search.engine/config";
import {tap} from "rxjs/operators";
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
    ce: CacheEngine;
    dbe: DataBaseService;
    constructor(context: Context) {
        context.dictionaryEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }

    getDict(id: string, limit = '200', skip = '0'): Observable<DictionaryItem[]> {
        const dict = dicts[id];
        if(!dict) {
            return throwError(`Словарь ${id} не найден`);
        }

        const fetchFromDB = (): Observable<DictionaryItem[]> => {
            let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;

            let likeStr = [...generateFilterQStr(dict?.filters || [], 'string'), ...generateFilterQStr(dict?.filters || [], 'flag')].join(' AND ');
            let whereStr = [...generateFilterQStr(dict?.filters || [], 'id')].join(' AND ');

            let q =
                `SELECT * 
                FROM \`${ dict.db }\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

            return this.dbe.query<DictionaryItem>(q).pipe(
                tap(data => this.ce.saveCacheData(`${id}`, data)),
                tap(result => {
                    if( dict.titleMap || dict.titleAddMap ){
                        result && result.forEach( r => {
                            r.title = dict.titleMap.map(f => r[f]).join(', ');
                            r.title = dict.titleAddMap ? r.title + ` ( ${dict.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                        })
                    }
                }),
            );
        };

        if(this.ce.checkCache(id)) {
            return this.ce.getCachedByKey(id);
        } else {
            return fetchFromDB()
        }
    }

    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end({err});
    }

    getRouter(): Router {
        return this.dict.get('/:id', (req, res) => {
            const id = req.params.id;
            if (!!id) this.getDict(id).subscribe((data) => res.send(data),  error => this.sendError(res, error));
        });
    }
}

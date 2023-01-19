import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Request, Response, Router} from "express";
import {Observable, throwError} from "rxjs";
import {generateFilterQStr} from "../db/sql.helper";
import {DataBaseService} from "../db/sql";
import {Context} from "../search/config";
import {tap} from "rxjs/operators";
import {dictionaries, IDictionaryFilters} from "./dictionary_repo";
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

    getDict(id: string, params: Request['query'] = {}, limit = '200', skip = '0'): Observable<DictionaryItem[]> {

        if(!id) {
            return throwError(`ID словаря не определен`);
        }

        const dictionaryConfig = dictionaries[id];
        if(!dictionaryConfig) {
            return throwError(`Словарь ${id} не найден`);
        }
        let filters = dictionaryConfig?.filters ?? [];

        filters = [
            ...filters,
            ...dictionaryConfig.autocomplete
                .filter(fk => fk.key in params)
                .map(ac => ({key: ac.key, type: ac.type, value: params[ac.key] } as IDictionaryFilters))
        ];

        let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;

        const likeStr = [
            ...generateFilterQStr(filters, 'string'),
            ...generateFilterQStr(filters, 'flag')]
            .join(' AND ');
        const whereStr = [...generateFilterQStr(filters, 'id')]
            .join(' AND ');

        const q =
            `SELECT * 
                FROM \`${ dictionaryConfig.db }\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

        const fetchFromDB = (): Observable<DictionaryItem[]> => {
            return this.dbe.queryList<DictionaryItem>(q).pipe(
                tap(data => this.ce.saveCacheData(`${q}`, data)),
                tap(result => {
                    if( dictionaryConfig.titleMap || dictionaryConfig.titleAddMap ){
                        result && result.forEach( r => {
                            r.title = dictionaryConfig.titleMap.map(f => r[f]).join(', ');
                            r.title = dictionaryConfig.titleAddMap ? r.title + ` ( ${dictionaryConfig.titleAddMap.map(f => r[f]).join(', ')} )` : r.title;
                        })
                    }
                }),
            );
        };

        if(this.ce.checkCache(q)) {
            return this.ce.getCachedByKey(q);
        } else {
            return fetchFromDB()
        }
    }

    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end(JSON.stringify({error: err}));
    }

    getRouter(): Router {
        return this.dict.get('/:id', (req, res) => {
            this.getDict(req.params.id, req.query).subscribe((data) => res.send(data),  error => this.sendError(res, error));
        });
    }
}

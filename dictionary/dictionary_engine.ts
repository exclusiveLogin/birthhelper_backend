import {IDictionaryFilters} from "./dictionary_repo";

import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Response, Router} from "express";
const pool = require('../db/sql');
const dicts = require('../dictionary/dictionary_repo');


export interface DictionaryItem {
    id: number;
    title: string;
    description: string;
    icon?: string;
    bg_color?: string;
}

type reqType = 'string' | 'id' | 'flag';

const concatFn = (arrA, arrB) => {
    if( arrA && arrA.length && arrB && arrB.length ){
        let fine = [];
        for(let i = 0; i < arrA.length; i++){
            fine.push(`${arrA[i]} = ${arrB[i]}`);
        }
        return fine;
    }
    return [];
}

const concatLikeFn = (arrA, arrB) => {
    if( arrA && arrA.length && arrB && arrB.length ){
        let fine = [];
        for(let i = 0; i < arrA.length; i++){
            fine.push(`${arrA[i]} LIKE "%${arrB[i]}%"`);
        }
        return fine;
    }
    return [];
}

export class DictionaryEngine {
    private dict = express.Router();

    constructor(private ce: CacheEngine) {}



    generateQStr(filters: IDictionaryFilters[], type: reqType): string[] {


        const filtered: IDictionaryFilters[] = [];
        const keys = [];
        const values = [];


        if (type === 'id') {
            filtered.push(
                ...filters.filter(k => k.type === 'number')
            );

            if(!filtered.length) return [];
            keys.push(filtered.map( k => k.key ));
            values.push(filtered.map( k => k.value ));

            return concatFn(keys, values);
        }

        if (type === 'string') {
            filtered.push(
                ...filters.filter(k => k.type === 'string')
            )

            if(!filtered.length) return [];
            keys.push(filtered.map( k => k.key ));
            values.push(filtered.map( k => `${k.value}`));

            return concatLikeFn(keys, values);
        }

        if (type === 'flag') {
            filtered.push(
                ...filters.filter(k => k.type === 'flag')
            )

            if(!filtered.length) return [];
            keys.push(filtered.map( k => k.key ));
            values.push(keys.map( k => `${ (k.value as any as boolean) == true ? '1' : '0'}` ));

            return concatLikeFn(keys, values);
        }

    }
    
    getDict(id: string, limit = '200', skip = '0'): Promise<DictionaryItem[]> {
        const dict = dicts[id];
        if(!dict) {
            return Promise.reject(`Словарь ${id} не найден`);
        }

        const fetchFromDB = new Promise<any[]>((resolve, rejects) => {
            let limstr = `${ !!skip ? ' LIMIT ' + limit + ' OFFSET ' + skip  : '' }`;

            let likeStr = [...this.generateQStr(dict?.filters || [], 'string'), ...this.generateQStr(dict?.filters || [], 'flag')].join(' AND ');
            let whereStr = [...this.generateQStr(dict?.filters || [], 'id')].join(' AND ');

            let q =
                `SELECT * 
                FROM \`${ dict.db }\` 
                ${(whereStr) ? 'WHERE ' + whereStr : ''} 
                ${likeStr ? ( whereStr ? ' AND ' : ' WHERE ') + likeStr : ''} 
                ${limstr}`;

            pool.query(q, (err, result)=> {
                if (err){
                    rejects(err);
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

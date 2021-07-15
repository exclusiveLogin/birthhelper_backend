import {DictionaryEngine} from "../dictionary/dictionary_engine";
const express = require('express');
import {Router} from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Context, getSearchConfig, SearchConfig, SearchFilter, SearchSection, sectionClinicConfig} from "./config";
import {zip} from "rxjs";
import {map} from "rxjs/operators";


export class SearchEngine {

    router: Router = express.Router();
    cache: CacheEngine;
    configSection = sectionClinicConfig;
    searchConfig: SearchConfig;

    constructor(private _ce: CacheEngine, private _de: DictionaryEngine) {
        const context: Context = {cacheEngine: this._ce, searchEngine: this, dictionaryEngine: this._de};
        this.searchConfig = getSearchConfig(context);
    }

    createVector(req, res, next): void {

    }

    rootHandler(req, res) {
        res.send({index: 'search root index'});
    }

    sendFiltersHandler(req, res): void {
        console.log(this);
        const conf = this.configSection[req.params.id];
        if (conf) {
            const f$ = conf.map(k => this.searchConfig[k].fetcher$);
            zip(...f$).pipe(
                map((data: SearchFilter[][]): SearchSection[] => {
                    const keys: string[] = Object.keys(this.searchConfig);

                    return data.map((filters, idx) => (
                        {
                            key: keys[idx],
                            title: this.searchConfig[keys[idx]].title,
                            filters: data[idx],
                            type: this.searchConfig[keys[idx]].type,
                        }
                    ));
                }),
            ).subscribe((results: SearchSection[]) => {
                console.log('search results:', results);
                res.send({index: 'search section', results});
            });
        } else {
            res.status(500);
            res.send({error: 'search key not found'});
        }

    }

    getRouter(_: CacheEngine): Router {
        this.cache = _;
        this.router.get('/', this.rootHandler.bind(this));
        this.router.get('/:id', this.sendFiltersHandler.bind(this));
        this.router.post('/', this.createVector.bind(this));

        return this.router;
    }


}

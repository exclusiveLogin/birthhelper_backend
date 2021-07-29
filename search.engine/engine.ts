import {DictionaryEngine} from "../dictionary/dictionary_engine";
import * as express from "express";
import {Router} from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Context, getSearchConfig, SearchConfig, SearchFilter, SearchSection, sectionClinicConfig} from "./config";
import {zip} from "rxjs";
import {map} from "rxjs/operators";
import {md5Encript} from "./sections.handler";

interface Hashed <T>{
    [hash: string]: T[]
}
type SectionKeys = keyof typeof sectionClinicConfig;
type TypeSection<T> = {
    [k in SectionKeys]: Hashed<T>
}

export interface SearchStore extends TypeSection<any> {}
export interface SetStore extends TypeSection<Setted> {}

export interface SlotPriceSet {
    min_price: number;
    max_price: number;
    avg_price: number;
    total_slots: number;
}

export interface Rating {
    min_rate: number;
    max_rate: number;
    avg_rate: number;
    count_votes: number;
}

export type Setted = (SlotPriceSet | Rating) & {id: number};

export class SearchEngine {

    router: Router = express.Router();
    cache: CacheEngine;
    configSection = sectionClinicConfig;
    searchConfig: SearchConfig;

    searchStore: SearchStore = {
        clinic: {}
    };
    setStore: SetStore = {
        clinic: {}
    };

    constructor(private _ce: CacheEngine, private _de: DictionaryEngine) {
        const context: Context = {cacheEngine: this._ce, searchEngine: this, dictionaryEngine: this._de};
        this.searchConfig = getSearchConfig(context);
    }

    createVector(req, res, next): void {

    }

    rootHandler(req, res) {
        res.send({index: 'search root index', testMD5: md5Encript({test: 'hello-world'})});
    }

    setDataStore(section: SectionKeys, hash: string, data: any): void {
        if (!this.checkSectionExist(section)) {
            this.searchStore[section] = {};
        }
        this.searchStore[section][hash] = data;
    }

    checkSectionExist(section: SectionKeys): boolean {
        return !!this.searchStore[section];
    }

    setSummaryStore(section: SectionKeys, hash: string, data: any): void {
        if (!this.checkSummarySectionExist(section)) {
            this.setStore[section] = {};
        }
        this.setStore[section][hash] = data;
    }

    checkSummarySectionExist(section: SectionKeys): boolean {
        return !!this.setStore[section];
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

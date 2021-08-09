import {DictionaryEngine} from "../dictionary/dictionary_engine";
import * as express from "express";
import {Router} from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {
    Context,
    getSearchConfig,
    SearchConfig, SearchConfigResponse,
    SearchFilter,
    SearchSection,
    sectionConfig,
    SectionKeys
} from "./config";
import {forkJoin, from, Observable, of, zip} from "rxjs";
import {filter, map, tap} from "rxjs/operators";
import {md5Encript} from "./sections.handler";
import {PipelineEngine} from "../search.engine/piplines.engine";
const bodyParser = require('body-parser');
const jsonparser = bodyParser.json();

interface Hashed <T>{
    [hash: string]: T;
}

type TypeSection<T = any> = {
    [k in SectionKeys]: Hashed<T>;
}

export interface SearchStore extends TypeSection<StoredIds> {}
export interface SummaryStore extends TypeSection<Summary> {}
export interface FilterStore extends TypeSection<FilterSection> {}

// при сильных различиях расширить условным generic
export type Summary = Partial<SummaryPrice & SummaryRate> & {id: number};

export type SummaryPrice = {
    min_price: number;
    max_price: number;
    avg_price: number;
    count_slots: number;
}

export interface SummaryRate {
    min_rate: number;
    max_rate: number;
    avg_rate: number;
    count_votes: number;
}

type SectionConfigType = typeof sectionConfig;
type FilterSectionKeys = SectionConfigType[SectionKeys][number];

export type StoredIds = number[];
export type FilterSectionFilter = {[key: string]: any};
export type FilterSection = { [filterSection in FilterSectionKeys]?: FilterSectionFilter}

export class SearchEngine {

    router: Router = express.Router();
    configSection = sectionConfig;
    searchConfig: SearchConfig;

    searchStore: SearchStore = {
        clinic: {}
    };
    summaryStore: SummaryStore = {
        clinic: {}
    };
    filterStore: FilterStore = {
        clinic: {}
    };

    pipeliner = new PipelineEngine(this._ce);

    constructor(private _ce: CacheEngine, private _de: DictionaryEngine) {
        const context: Context = {cacheEngine: this._ce, searchEngine: this, dictionaryEngine: this._de};
        this.searchConfig = getSearchConfig(context);

        // const mock = {
        //     clinic_facilities_birth_section: {14: true,},
        //     clinic_placement_birth_section: {3: true},
        //     clinic_personal_birth_section: {},
        //     clinic_type_birth_section: {1: true}
        // }

        // this.setFilterStore("clinic", '_', mock);
        // console.log('setFilterStore result:', this.filterStore);

        // this.pipeliner.clinic_facilities_birth_section(14).subscribe((result) => console.log('clinic_facilities_birth_section result:', result));
        // this.pipeliner.clinic_placement_birth_section(3).subscribe((result) => console.log('clinic_placement_birth_section result:', result));
        // this.pipeliner.clinic_personal_birth_section(1).subscribe((result) => console.log('clinic_personal_birth_section result:', result));
        // this.pipeliner.clinic_type_birth_section(1).subscribe((result) => console.log('clinic_type_birth_section result:', result));

        // this.getEntitiesIDByHash("clinic", '_').subscribe(
        //     result => console.log('getEntitiesIDByHash result:', result),
        //     (err) => console.error('getEntitiesIDByHash error: ', err)
        // );
    }

    intersector(a: Array<number>, b: Array<number>): number[] {
        return [...new Set(a.filter(i => b.includes(i)))]
    }

    getEntitiesIDByHash(key: SectionKeys, hash: string): Observable<StoredIds>{
        const config = this.searchConfig[key];
        if(!config) return null;

        // проверяем кеш
        const stored = this.getSearchStore(key, hash);
        if(stored)return of(stored);

        // забираем фильтры по хешу
        const filters = this.getFilterStore(key, hash);
        if(!filters) return null;

        // генерируем пайп поиска.
        const keys = Object.keys(filters);

        // valueKeys
        const pipes = keys.map((k: FilterSectionKeys, idx) => {
            const type = config[k].type;

            const filterSection = filters[k];

            let searchEnt = [];
            if(type === "flag" || type === "select") {
                searchEnt = Object.keys(filterSection)
            }

            // console.log('searchEnt ', searchEnt);

            // return of(searchEnt);
            return this.pipeliner.getPipelineContext(k, searchEnt).pipe(
                map(data => data ? data.reduce((acc, cur) => acc ? this.intersector(acc, cur) : cur) : null),
            );
        });

        const mergePipe = this.pipeliner.mergePipelines[key];
        if(mergePipe) pipes.push(mergePipe())

        // вертаем в зад только совпавшие ids сущностей
        return forkJoin(pipes).pipe(
            map(data => data.filter(d => !!d)),
            map(data => data.reduce((acc, cur) => acc ? this.intersector(acc, cur) : cur, null)),
            tap(ids => this.setSearchStore(key, hash, ids)),
            // tap(data => console.log('getEntitiesIDByHash, forkJoin', data)),
        )
    }

    validator<T extends SectionKeys>(json: SearchConfigResponse<T>, section: SectionKeys): string {

        let valid = false;
        const config = this.searchConfig[section];
        const keys: Array<FilterSectionKeys> = Object.keys(config) as Array<FilterSectionKeys>;
        const result: FilterSection = {};

        keys.forEach(k => {
            const targetType = config[k]?.type;
            const filterSectionData = json[k];

            if (filterSectionData){
                result[k] = filterSectionData;
                if (targetType === "flag" || targetType === "select") {
                    valid = !!Object.keys(filterSectionData).length;
                }
            }
        });

        console.log('tick validator:', result, valid);

        if (valid){
            const hash = md5Encript(result);
            this.setFilterStore(section, hash, result);
            return hash;
        }

        return null;
    }

    createVector(req, res, next): void {
        const section = req.params.id;
        const body = req.body;

        let hash: string;
        let searchKey: SectionKeys;

        if(section === 'clinic') searchKey = section;

        if(searchKey) hash = this.validator<typeof searchKey>(body || {}, searchKey)

        if(hash){
            res.status(201);
            res.send({hash, input: body, result: this.getFilterStore(section, hash)});

            console.log('createVector', this.filterStore);
        } else {
            res.status(500);
            res.send({error: 'not valid query', body, section});
        }



    }

    rootHandler(req, res) {
        res.send({index: 'search root index', testMD5: md5Encript({test: 'hello-world'})});
    }

    setSearchStore(section: SectionKeys, hash: string, data: any): void {
        if (!this.checkSectionExist(section)) {
            this.searchStore[section] = {};
        }
        this.searchStore[section][hash] = data;
    }

    getSearchStore(section: SectionKeys, hash: string): StoredIds {
        if (this.checkSearchSectionExist(section)) {
            return this.searchStore[section][hash];
        }
        return null;
    }

    checkSectionExist(section: SectionKeys): boolean {
        return !!this.searchStore[section];
    }

    setSummaryStore(section: SectionKeys, hash: string, data: any): void {
        if (!this.checkSummarySectionExist(section)) {
            this.summaryStore[section] = {};
        }
        this.summaryStore[section][hash] = data;
    }

    checkSummarySectionExist(section: SectionKeys): boolean {
        return !!this.summaryStore[section];
    }

    setFilterStore(section: SectionKeys, hash: string, data: FilterSection): void {
        if (!this.checkFilterSectionExist(section)) {
            this.filterStore[section] = {};
        }
        this.filterStore[section][hash] = data;
    }

    getFilterStore(section: SectionKeys, hash: string): FilterSection {
        if (this.checkFilterSectionExist(section)) {
            return this.filterStore[section][hash];
        }

        return null;
    }

    checkFilterSectionExist(section: SectionKeys): boolean {
        return !!this.filterStore[section];
    }

    checkSearchSectionExist(section: SectionKeys): boolean {
        return !!this.searchStore[section];
    }

    sendFiltersHandler(req, res): void {
        const section: SectionKeys = req.params.id;
        const keys = this.configSection[section];
        const conf = keys.map(k => this.searchConfig[section][k]);
        if (conf) {
            const f$ = conf.map(k => k.fetcher$);
            zip(...f$).pipe(
                map((data: SearchFilter[][]): SearchSection[] => {
                    console.log('tick', data)
                    return data.map((filters, idx) => (
                        {
                            key: keys[idx],
                            title: this.searchConfig[section][keys[idx]].title,
                            filters: data[idx],
                            type: this.searchConfig[section][keys[idx]].type,
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

    hashFilterHandler(req, res): void {
        const section: SectionKeys = req.params.id;
        const hash: SectionKeys = req.params.hash;

        const filters = this.getFilterStore(section, hash);

        if(!filters) {
            res.status(500);
            res.send({error: 'hash or section key invalid'});
            return;
        }

        res.send({filters});

    }

    sendIdsByHashHandler(req, res): void {
        const section: SectionKeys = req.params.id;
        const hash: SectionKeys = req.params.hash;

        const hashProvider = this.getEntitiesIDByHash(section, hash);

        if(!section || !hash || !hashProvider) {
            res.status(500);
            res.send({error: 'hash or section key invalid'});
            return;
        }

        this.getEntitiesIDByHash(section, hash).subscribe(ids => res.send({ids}));

    }

    getRouter(): Router {
        this.router.get('/', this.rootHandler.bind(this));
        this.router.get('/:id', this.sendFiltersHandler.bind(this));
        this.router.get('/:id/:hash', this.sendIdsByHashHandler.bind(this));
        this.router.get('/:id/filters/:hash', this.hashFilterHandler.bind(this));
        this.router.post('/:id', jsonparser, this.createVector.bind(this));

        return this.router;
    }


}

import * as express from "express";
import {Router} from "express";
import {
    Context,
    getSearchConfig,
    SearchConfig, SearchConfigResponse,
    SearchFilter,
    SearchSection,
    sectionConfig,
    SectionKeys
} from "./config";
import {forkJoin, Observable, of, zip} from "rxjs";
import {map, tap} from "rxjs/operators";
import {md5Encript} from "./sections.handler";
import {PipelineEngine} from "../search.engine/piplines.engine";
import { OkPacket } from "mysql";
const bodyParser = require('body-parser');
const jsonparser = bodyParser.json();

interface Hashed <T>{
    [hash: string]: T;
}

type TypeSection<T = any> = {
    [k in SectionKeys]: Hashed<T>;
}

export interface SearchStore extends TypeSection<string> {}
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

export interface SearchMemo {
    hash: string;
    section: SectionKeys;
    filters: FilterSection
}

export interface SearchMemoSrc {
    hash: string;
    filters: string;
    section: string;
    datetime_create: string;
    datetime_update: string;
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

    pipeliner = new PipelineEngine(this.context);

    constructor(private context: Context) {
        context.searchEngine = this;
        this.searchConfig = getSearchConfig(context);

        this.initFiltersFromDB();
    }

    async initFiltersFromDB(): Promise<void> {
        try {
            const filters = await this.loadFiltersFromDB();
            filters?.forEach(f => this.setFilterStore(f.section, f.hash, f.filters))
            console.error('initFiltersFromDB RESULT:', filters);
        } catch(e) {
            console.error('initFiltersFromDB ERR:', e)
        }
    }

    saveFiltersToDb(section: SectionKeys, hash: string, filters: FilterSection): Promise<number> {
        const q = `INSERT INTO \`search\` 
        (hash, section, filters) 
        VALUES ('${hash}', '${section}', '${JSON.stringify(filters)}') 
        ON DUPLICATE KEY UPDATE 
        section = '${section}',
        filters = '${JSON.stringify(filters)}'`;


        console.log('saveFiltersToDb', q);
        return this.context.dbe.query(q).pipe(
            map((result: any) => (result as OkPacket).insertId),
            ).toPromise();
    }

    async loadFiltersFromDbByHash(section: SectionKeys, hash: string): Promise<FilterSection> {
        const q = `SELECT * FROM \`search\` WHERE section = "${section}" AND hash = "${hash}"`;
        return this.context.dbe.query<SearchMemoSrc>(q)
            .pipe(
                map(result => {
                    if(!result.length){
                        throw new Error('Не найдена запить в БД по хешу')
                    }
                    return JSON.parse(result[0].filters) as FilterSection;
                }),
            ).toPromise();
    }

    loadFiltersFromDB(): Promise<SearchMemo[]> {
        const q = `SELECT * FROM \`search\``;
        return this.context.dbe.query<SearchMemoSrc>(q)
            .pipe(
                map(result => {
                    const compile: SearchMemo[] = result.map((item) => {
                        const _item = item as SearchMemo;
                        const _f = JSON.parse(item.filters) as FilterSection;
                        _item.filters = _f
                        return _item;
                    });

                    return compile;
                }),
            ).toPromise();
    }

    intersector(a: Array<number>, b: Array<number>): number[] {
        return [...new Set(a.filter(i => b.includes(i)))]
    }

    getEntitiesIDByHash(key: SectionKeys, hash: string): Observable<StoredIds>{
        const config = this.searchConfig[key];
        if(!config) return null;

        // проверяем кеш
        const stored = this.getSearchStore(key, hash);
        if(stored){
            // console.log('cached: hash', hash, stored, this.searchStore);
            return of(stored);
        }

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
            // tap(data => console.log('getEntitiesIDByHash, forkJoin', data)),
            tap(ids => this.setSearchStore(key, hash, ids)),

        )
    }

    validator<T extends SectionKeys>(json: SearchConfigResponse<T>, section: SectionKeys): [boolean, SearchConfigResponse<T>] {

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

        return [valid, result];
    }

    createVector(req, res, next): void {
        const section = req.params.id;
        const body = req.body;

        let hash: string;
        let searchKey: SectionKeys;

        if(section === 'clinic') searchKey = section;
        if(searchKey) {
            const valid = this.validator<typeof searchKey>(body || {}, searchKey);
            if(valid[0]) {
                hash = md5Encript(valid[1]);
                this.setFilterStore(section, hash, valid[1]);
            }
        }

        if(hash){
            res.status(201);
            res.send({hash, input: body, result: this.getFilterStore(section, hash)});

            // console.log('createVector', this.filterStore);
        } else {
            res.status(500);
            res.send({error: 'not valid query', body, section});
        }



    }

    rootHandler(req, res) {
        res.send({index: 'search root index', testMD5: md5Encript({test: 'hello-world'})});
    }

    setSearchStore(section: SectionKeys, hash: string, data: any): void {
        // console.log('set cache: ', hash, data, this.searchStore);
        if (!this.checkSectionExist(section)) {
            // console.log('non searchStore.... created');
            this.searchStore[section] = {};
        }
        this.searchStore[section][hash] = JSON.stringify(data);
        // console.log('set searchStore.... created', this.searchStore);
    }

    getSearchStore(section: SectionKeys, hash: string): StoredIds {
        if (this.checkSearchSectionExist(section)) {
            // console.log('getSearchStore, ', section, hash, this.searchStore[section][hash]);
            return this.searchStore[section][hash] ? JSON.parse(this.searchStore[section][hash]) : null;
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

        console.log('setFilterStore', this.filterStore);

        this.saveFiltersToDb(section, hash, data);
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

    resetSearchStoreBySection(section?: SectionKeys): void {
        if(!section) {
            const keys = Object.keys(this.searchStore);
            keys.forEach(k => this.searchStore[k] = {});
            return;
        }

        console.log('resetSearchStoreBySection', section, this.searchStore);
        this.searchStore[section] = {};
    }

    resetSummaryStoreBySection(section?: SectionKeys): void {
        if(!section) {
            const keys = Object.keys(this.summaryStore);
            keys.forEach(k => this.summaryStore[k] = {});
            return;
        }

        console.log('resetSummaryStoreBySection', section, this.summaryStore);
        this.summaryStore[section] = {};
    }

    sendFiltersHandler(req, res): void {
        const section: SectionKeys = req.params.id;
        const keys = this.configSection[section];
        const conf = keys.map(k => this.searchConfig[section][k]);
        if (conf) {
            const f$ = conf.map(k => k.fetcher$);
            zip(...f$).pipe(
                map((data: SearchFilter[][]): SearchSection[] => {
                    // console.log('tick', data)
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
                // console.log('search results:', results);
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

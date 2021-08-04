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
import {Observable, zip} from "rxjs";
import {map} from "rxjs/operators";
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
export type FilterSection = { [filterSection in FilterSectionKeys]?: { [key: string]: any }}

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

        this.pipeliner.clinic_facilities_birth_section(14).subscribe((result) => console.log('clinic_facilities_birth_section result:', result));
        this.pipeliner.clinic_placement_birth_section(3).subscribe((result) => console.log('clinic_placement_birth_section result:', result));
        this.pipeliner.clinic_personal_birth_section(1).subscribe((result) => console.log('clinic_personal_birth_section result:', result));
    }

    getEntitiesByHash<T>(key: SectionKeys, hash: string): Observable<T[]>{
        return
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

    getRouter(): Router {
        this.router.get('/', this.rootHandler.bind(this));
        this.router.get('/:id', this.sendFiltersHandler.bind(this));
        this.router.post('/:id', jsonparser, this.createVector.bind(this));

        return this.router;
    }


}

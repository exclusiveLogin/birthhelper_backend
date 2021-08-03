import {Observable, of, throwError} from "rxjs";
import {sectionConfig, SectionKeys} from "./config";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Summary} from "../search.engine/engine";
import {tap} from "rxjs/operators";
const pool = require('../db/sql');


type ChapterKeys = typeof sectionConfig[SectionKeys]
type keys = ChapterKeys[number];

export class PipelineEngine {

    clinic_summary_pipeline_default(): Observable<Summary> {
        const cacheKey = `clinic.summary.default`;

        const q = `SELECT contragent_id as id, 
                    COUNT(id), 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    GROUP BY contragent_id`;

        return this.ce.checkCache(cacheKey) ?
            of(this.ce.getCachedByKey<Summary>(cacheKey)) :
            this.query<Summary>(q).pipe(
                tap(result => this.ce.saveCacheData(cacheKey, result))
            );
    }

    clinic_facilities_birth_section(): Observable<any> {
        return of(null);
    }

    clinic_personal_birth_section(): Observable<any> {
        return of(null);
    }

    clinic_placement_birth_section(): Observable<any> {
        return of(null);
    }

    clinic_type_birth_section(): Observable<any> {
        return of(null);
    }

    pipelines: { [key in keys]: (...args: any) => Observable<any> } = {
        clinic_facilities_birth_section: this.clinic_facilities_birth_section,
        clinic_personal_birth_section: this.clinic_personal_birth_section,
        clinic_placement_birth_section: this.clinic_placement_birth_section,
        clinic_type_birth_section: this.clinic_type_birth_section,
    }

    summaryPipelines: { [key in SectionKeys]: (...args: any) => Observable<Summary> } = {
        clinic: this.clinic_summary_pipeline_default,
    }

    constructor(
        private ce: CacheEngine,
    ) {
    }

    query<T>(q: string): Observable<any> {
        return new Observable<T[]>(observer => {
           pool.query(q, (err, result) => {
               if(err){
                   observer.error(err);
               }
               observer.next(result);
           });
        });
    }

    getPipelineContext<T>(key: string, ...args: any): Observable<T[]>{
        const pipe = this.pipelines[key];
        return pipe ? pipe(...args) : of(null);
    }

    getSummaryPipelineContext<T>(key: string, ...args: any): Observable<T[]>{
        const pipe = this.summaryPipelines[key];
        return pipe ? pipe(...args) : of(null);
    }
}

import {Observable, of, throwError} from "rxjs";
import {sectionClinicConfig} from "./config";
import {CacheEngine} from "../cache.engine/cache_engine";

const pool = require('../db/sql');

interface ClinicSetMini {
    average:number;
    min: number;
    max: number;
}

interface ClinicSetSummary extends ClinicSetMini{
    total: number;
}

interface PipeClinicResult_Item {
    id: number;
    set: ClinicSetMini;
}

interface PipeClinicResult {
    ids: PipeClinicResult_Item[];
    summarySet: ClinicSetSummary;
}

const clinicSectionKeys = sectionClinicConfig.clinic;
type keys = typeof clinicSectionKeys[number];

export class PiplinesEngine {
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

    pipelines: { [key in keys]: (key: string, ...args: any) => Observable<any> } = {
        clinic_facilities_birth_section: this.clinic_facilities_birth_section,
        clinic_personal_birth_section: this.clinic_personal_birth_section,
        clinic_placement_birth_section: this.clinic_placement_birth_section,
        clinic_type_birth_section: this.clinic_type_birth_section,
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

    hasher(data: any[]): string {
        return ;
    }

    getPipelineContext<T>(key: string, ...args: any): Observable<T[]>{
        const pipe = this.pipelines[key];
        return pipe ? pipe(...args) : throwError(new Error('pipe not found'));
    }
}

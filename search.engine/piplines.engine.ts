import {Observable, of} from "rxjs";
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

    pipelinesClinic: { [key in keys]: Observable<any> } = {
        clinic_facilities_birth_section: of(null),
        clinic_personal_birth_section: of(null),
        clinic_placement_birth_section: of(null),
        clinic_type_birth_section: of(null),
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

    getPipelineContext<T>(): Observable<T[]>{
        return ;
    }
}

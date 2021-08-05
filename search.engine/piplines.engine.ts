import {Observable, of} from "rxjs";
import {sectionConfig, SectionKeys} from "./config";
import {CacheEngine} from "../cache.engine/cache_engine";
import {StoredIds, Summary} from "../search.engine/engine";
import {map, switchMap, tap} from "rxjs/operators";
import {cacheKeyGenerator} from "../search.engine/sections.handler";
const pool = require('../db/sql');

interface ContainersByFacilities{
    id: number;
    facility_id: number;
    container_id: number;
}

type ChapterKeys = typeof sectionConfig[SectionKeys]
type keys = ChapterKeys[number];

export class PipelineEngine {

    clinic_summary_pipeline_default(): Observable<Summary[]> {
        const cacheKey = `clinic.summary.default`;

        const q = `SELECT contragent_id as id, 
                    COUNT(id), 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    GROUP BY contragent_id`;

        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);
    }

    clinic_facilities_birth_section(facilityId: number): Observable<StoredIds> {

        const cacheKey = cacheKeyGenerator('ent_facilities_containers', 'facility_id', facilityId);

        // first step containers by facilities
        // определяем какие контейнеры содержат услугу
        const q = `SELECT * FROM \`facilities_containers\` WHERE facility_id = ${facilityId}`;

        return of(null).pipe(
            switchMap(() => this.getEntitiesByDBOrCache<ContainersByFacilities>(q, cacheKey)),
            map(data => data.map(c => c.container_id)),
            // тут получаем ids контейнеров в которых есть данное удобство
            switchMap(container_ids => {
                // определяем какие контейнеры содержат услугу
                const cacheKey = cacheKeyGenerator(
                    'ent_placement_slots',
                    'ent_facilities',
                    container_ids,
                    'grouped',
                    'contragent_id');

                const whereStr = container_ids.map(id => `facilities_type = ${id}`).join(' OR ');

                const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE ${whereStr}
                    GROUP BY contragent_id`;

                // console.log('clinic_facilities_birth_section: ', q, cacheKey);

                return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);
            }),
            map(data => data.map(c => c.id)),
        )

    }

    clinic_personal_birth_section(positionId: number): Observable<StoredIds> {

        const cacheKey = cacheKeyGenerator(
            'ent_doctor_slots',
            'ent_doctor_position',
            positionId,
            'grouped',
            'contragent_id');

        // Scoring по клиникам содержащим врача выбранной специализации как услугу. с подготовкой сета
        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE service_id IN 
                    (SELECT id FROM doctors WHERE position = ${positionId})
                    AND service_type = 1
                    GROUP BY contragent_id`;

        // console.log('clinic_personal_birth_section: ', q, cacheKey);
        return of(null).pipe(
            switchMap(() => this.getEntitiesByDBOrCache<Summary>(q, cacheKey)),
            map(data => data.map(c => c.id)),
        );
    }

    clinic_placement_birth_section(serviceId: number): Observable<StoredIds> {

        const cacheKey = cacheKeyGenerator(
            'ent_placement_slots',
            'service_id',
            serviceId,
            'grouped',
            'contragent_id');

        // Scoring по клиникам содержащим данный вид палаты
        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE \`service_type\` = 2 
                    AND \`service_id\` = ${serviceId} 
                    GROUP BY contragent_id`;

        // console.log('clinic_placement_birth_section: ', q, cacheKey);
        return of(null).pipe(
            switchMap(() => this.getEntitiesByDBOrCache<Summary>(q, cacheKey)),
            map(data => data.map(c => c.id)),
        )
    }

    clinic_type_birth_section(birthTypeId: number): Observable<StoredIds> {
        // Scoring по клиникам содержащим в виде слота данный тип родов с подготовкой сета
        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE service_id IN 
                    (SELECT id FROM birth_clinic_type WHERE id = 1)
                    AND service_type = 3
                    GROUP BY contragent_id`;

        const cacheKey = cacheKeyGenerator(
            'ent_placement_slots',
            'ent_birthtype',
            birthTypeId,
            'grouped',
            'contragent_id');

        // console.log('clinic_placement_birth_section: ', q, cacheKey);
        return of(null).pipe(
            switchMap(() => this.getEntitiesByDBOrCache<Summary>(q, cacheKey)),
            map(data => data.map(c => c.id)),
        )
    }

    pipelines: { [key in keys]: (...args: any) => Observable<any> } = {
        clinic_facilities_birth_section: this.clinic_facilities_birth_section,
        clinic_personal_birth_section: this.clinic_personal_birth_section,
        clinic_placement_birth_section: this.clinic_placement_birth_section,
        clinic_type_birth_section: this.clinic_type_birth_section,
    }

    summaryPipelines: { [key in SectionKeys]: () => Observable<Summary[]> } = {
        clinic: this.clinic_summary_pipeline_default,
    }

    constructor(
        private ce: CacheEngine,
    ) {
    }

    query<T>(q: string): Observable<T[]> {
        return new Observable<T[]>(observer => {
           pool.query(q, (err, result) => {
               if(err){
                   observer.error(err);
               }
               observer.next(result);
           });
        });
    }

    getEntitiesByDBOrCache<T>(q: string, cacheKey: string): Observable<T[]> {
        return this.ce.checkCache(cacheKey) ?
            this.ce.getCachedByKey<T[]>(cacheKey) :
            this.query<T>(q).pipe(
                map(data => !!data ? data : []),
                tap(data => this.ce.saveCacheData(cacheKey, data)),
            )
    }

    // эта штука должна сразу возвращить intersect массив клиник
    getPipelineContext<T>(key: string, args: any[]): Observable<T[]>{
        const pipe = this.pipelines[key];
        return pipe ? pipe(...args) : of(null);
    }

    getSummaryPipelineContext<T>(key: string, ...args: any): Observable<T[]>{
        const pipe = this.summaryPipelines[key];
        return pipe ? pipe(...args) : of(null);
    }
}

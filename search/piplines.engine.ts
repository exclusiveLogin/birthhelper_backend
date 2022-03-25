import { forkJoin, Observable, of } from "rxjs";
import { Context, sectionConfig, SectionKeys } from "./config";
import { StoredIds, Summary } from "../search/engine";
import { catchError, map, tap } from "rxjs/operators";
import { cacheKeyGenerator } from "../search/sections.handler";
import {Entity, FilterParams} from "../entity/entity_engine";

type ChapterKeys = typeof sectionConfig[SectionKeys]
type keys = ChapterKeys[number];

export class PipelineEngine {

    clinic_summary_pipeline_default(): Observable<Summary[]> {
        const cacheKey = `clinic.summary.default`;

        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot
                    WHERE section = "clinic"
                    GROUP BY contragent_id`;

        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey).pipe(map(result => result.map((sum) => (
            {
                ...sum,
                avg_price: Math.floor(sum.avg_price),
                min_price: Math.floor(sum.min_price),
                max_price: Math.floor(sum.max_price)
            }))));
    }

    consultation_summary_pipeline_default(): Observable<Summary[]> {
        const cacheKey = `clinic.summary.default`;

        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE section = "consultation"
                    GROUP BY contragent_id`;

        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey).pipe(map(result => result.map((sum) => (
            {
                ...sum,
                avg_price: Math.floor(sum.avg_price),
                min_price: Math.floor(sum.min_price),
                max_price: Math.floor(sum.max_price)
            }))));
    }

    clinic_active_pipeline(): Observable<StoredIds> {
        const filters: FilterParams = { active: '1' };

        return this.context.entityEngine.getEntities('ent_clinics', null, filters).pipe(
            map(clinics => clinics.map(clinic => clinic.id)),
        );
    }

    consultation_active_pipeline(): Observable<StoredIds> {
        const filters: FilterParams = { active: '1' };

        return this.context.entityEngine.getEntities('ent_consultations', null, filters).pipe(
            map(clinics => clinics.map(clinic => clinic.id)),
        );
    }

    clinic_facilities_birth_section(facilityId: number): Observable<Summary[]> {

        // определяем какие контейнеры содержат услугу
        const cacheKey = cacheKeyGenerator(
            'ent_placement_slots',
            'ent_facilities',
            facilityId,
            'grouped',
            'contragent_id');

        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE facilities_type IN 
                    (
                        SELECT \`container_id\` 
                        FROM \`facilities_containers\` 
                        WHERE ${facilityId ? 'facility_id = ' + facilityId : 1}
                    )
                    GROUP BY contragent_id`;

        // console.log('clinic_facilities_birth_section: ', q, cacheKey);

        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);

    }

    clinic_personal_birth_section(positionId: number): Observable<Summary[]> {

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
                    (SELECT id FROM doctors WHERE ${positionId ? 'position = ' + positionId : 1})
                    AND slot_category_type = 1
                    GROUP BY contragent_id`;

        // console.log('clinic_personal_birth_section: ', q, cacheKey);
        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);
    }

    clinic_placement_birth_section(serviceId: number): Observable<Summary[]> {

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
                    WHERE \`slot_category_type\` = 2 
                    ${serviceId ? 'AND `service_id\` = ' + serviceId : 1} 
                    GROUP BY contragent_id`;

        // console.log('clinic_placement_birth_section: ', q, cacheKey);
        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);

    }

    clinic_type_birth_section(birthTypeId: number): Observable<Summary[]> {

        const cacheKey = cacheKeyGenerator(
            'ent_placement_slots',
            'ent_birthtype',
            birthTypeId,
            'grouped',
            'contragent_id');

        // Scoring по клиникам содержащим в виде слота данный тип родов с подготовкой сета
        const q = `SELECT contragent_id as id, 
                    COUNT(id) as count_slots, 
                    MAX(price) as max_price, 
                    MIN(price) as min_price, 
                    AVG(price) as avg_price 
                    FROM service_slot 
                    WHERE service_id IN 
                    (SELECT id FROM birthtype WHERE ${birthTypeId ? 'id = ' + birthTypeId : 1})
                    AND slot_category_type = 3
                    GROUP BY contragent_id`;

        // console.log('clinic_placement_birth_section: ', q, cacheKey);
        return this.getEntitiesByDBOrCache<Summary>(q, cacheKey);

    }

    consultation_avo_flag(_): Observable<Entity[]> {
        const filters: FilterParams = { avo: '1' };
        console.log('consultation_avo_flag: ', _);

        return this.context.entityEngine.getEntities('ent_consultations', null, filters);

    }

    pipelines: { [key in keys]: (arg: any) => Observable<Summary[]> } = {
        clinic_facilities_birth_section: this.clinic_facilities_birth_section.bind(this),
        clinic_personal_birth_section: this.clinic_personal_birth_section.bind(this),
        clinic_placement_birth_section: this.clinic_placement_birth_section.bind(this),
        clinic_type_birth_section: this.clinic_type_birth_section.bind(this),
        consultation_avo_flag: this.consultation_avo_flag.bind(this),
    }

    summaryPipelines: { [key in SectionKeys]: () => Observable<Summary[]> } = {
        clinic: this.clinic_summary_pipeline_default.bind(this),
        consultation: this.consultation_summary_pipeline_default.bind(this),
    }

    mergePipelines: { [key in SectionKeys]: () => Observable<StoredIds> } = {
        clinic: this.clinic_active_pipeline.bind(this),
        consultation: this.consultation_active_pipeline.bind(this),
    }

    constructor(private context: Context) {
    }

    getEntitiesByDBOrCache<T>(q: string, cacheKey: string): Observable<T[]> {

        return this.context.cacheEngine.checkCache(cacheKey) ?
            this.context.cacheEngine.getCachedByKey<T[]>(cacheKey).pipe(
                // tap(data => console.log('getEntitiesByDBOrCache CACHE log', cacheKey, data.length)),
            ) :
            this.context.dbe.queryList<T>(q).pipe(
                // tap(data => console.log('getEntitiesByDBOrCache DB log', q, cacheKey, data.length)),
                catchError(err => {
                    console.error('getEntitiesByDBOrCache error', q, cacheKey, err);
                    return [];
                }),
                tap(data => this.context.cacheEngine.saveCacheData(cacheKey, data)),
            )
    }

    // эта штука должна сразу возвращить intersect массив клиник
    getPipelineContextIds(key: keys, args: any[]): Observable<StoredIds[]> {
        const pipe = this.pipelines[key];

        return pipe && args.length ?
            forkJoin(args.map(arg => pipe(arg).pipe(map(result => result.map(r => r.id))))) :
            of<StoredIds[]>(null);
    }

    getPipelineContextSummary(key: keys, args: any[]): Observable<Summary[][]> {
        const pipe = this.pipelines[key];
        return pipe && args.length ?
            forkJoin(args.map(arg => pipe(arg))) :
            of<Summary[][]>(null);
    }

    getDefaultSummaryPipelineContext(key: SectionKeys): Observable<Summary[]> {
        const pipe = this.summaryPipelines[key];
        return pipe ? pipe() : of([]);
    }
}

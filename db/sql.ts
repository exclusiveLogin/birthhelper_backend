import {sqlConfig} from "./sql.config";
import {Observable, of, pipe} from "rxjs";
import {Context} from "../search/config";
import { createPool } from "mysql";
import {map, switchMap, tap} from "rxjs/operators";
import {Entity} from "../entity/entity_engine";

export class DataBaseService {
    constructor(private context: Context) {
        context.dbe = this;
    }

    pool = createPool(sqlConfig);

    queryList<T>(q: string): Observable<T[]> {
        return new Observable<T[]>(observer => {
            this.pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result as T[]);
                observer.complete();
            });
        });
    }

    query<T>(q: string): Observable<T> {
        return new Observable<T>(observer => {
            this.pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result as T);
                observer.complete();
            });
        });
    }

    saveToCache(cacheKey?: string, data?: any): void {
        if(cacheKey) this.context.cacheEngine.saveCacheData(cacheKey, data);
    }

    getEntityFromDB(query: string, cacheKey?: string): Observable<Entity> {
        const pipeline = this.query<Entity>(query);
        return pipeline.pipe(
            switchMap((result) =>
                this.context.cacheEngine.checkCache(cacheKey) ?
                    this.context.cacheEngine.getCachedByKey<Entity>(cacheKey) :
                    of(result)),
            tap((result) => this.saveToCache(cacheKey, result)),
        )

    }

    getEntitiesFromDB(query: string, cacheKey?: string): Observable<Entity[]> {
        const pipeline = this.queryList<Entity>(query);
        return pipeline.pipe(
            switchMap((result) =>
                this.context.cacheEngine.checkCache(cacheKey) ?
                    this.context.cacheEngine.getCachedByKey<Entity[]>(cacheKey) :
                    of(result)),
            tap((result) => this.saveToCache(cacheKey, result)),
        )

    }
}

import {Observable, of, throwError} from "rxjs/dist/types";

interface CacheStore {
    [key: string]: any;
}

export class CacheEngine {
    store: CacheStore;

    constructor() {
        this.store = {};
    }

    getCachedByKey<T = any | any[]>(key: string): Observable<T> {
        return this.store[key] ? of(this.store[key]) : throwError(() => new Error('Нет данных в кеше по ключу' + key));
    }

    getCacheInStore(): Observable<CacheStore> {
        return of(this.store);
    }

    saveCacheData(key: string, data: any): void {
        this.store[key] = data;
    }

    clearCache(): void {
        this.store = {};
    }

    clearCacheByKey(key: string): void {
        delete this.store[key];
    }
}

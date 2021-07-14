import {Observable, of, throwError} from "rxjs";

interface CacheStore {
    [key: string]: any;
}

export class CacheEngine {
    store: CacheStore;

    constructor() {
        this.store = {};
    }

    checkCache(key: string): boolean {
        return !!this.store[key];
    }

    getCachedByKey<T = any | any[]>(key: string): Observable<T> {
        return this.store[key] ? of(JSON.parse(this.store[key])) : throwError(() => new Error('Нет данных в кеше по ключу' + key));
    }

    getCacheInStore(): Observable<CacheStore> {
        return of(this.store);
    }

    saveCacheData(key: string, data: any): void {
        this.store[key] = JSON.stringify(data);
    }

    clearCache(): void {
        this.store = {};
    }

    clearCacheByKey(key: string): void {
        delete this.store[key];
    }
}

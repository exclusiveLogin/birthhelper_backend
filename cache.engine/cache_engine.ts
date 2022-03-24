import {Observable, of, throwError} from "rxjs";
import {Context} from "../search/config";
import {Request, Response, Router} from "express";
import * as express from "express";

interface CacheStore {
    [key: string]: any;
}

export class CacheEngine {
    store: CacheStore;
    slot = express.Router();
    context: Context;

    constructor(context: Context) {
        context.cacheEngine = this;
        this.store = {};
        this.context = context;
    }

    checkCache(key: string): boolean {
        return !!this.store[key];
    }

    getCachedByKey<T>(key: string): Observable<T> {
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

    softClearBykey(key: string): void {
        const keys = Object.keys(this.store);
        const delKeys = keys.filter(k => k.includes(key));
        console.log('softClearBykey keys', keys, delKeys);
        delKeys.forEach(k => delete this.store[k]);
    }

    rootHandler(req, res) {
        res.set('Content-Type', 'text/html');
        res.write('ROOT CacheEngine<br>');

        res.write('<p> Формат запроса GET /clean </p> <br>');
        res.write('<p> you must have token better admin role</p> <br>');
        res.end();
    }

    cleanCacheHandler(req: Request, res: Response, next){
        this.clearCache();
        res.send({ result: 'All Cache records cleaned'});
    }

    getRouter(): Router {
        this.slot.get('/',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.rootHandler);

        this.slot.get('/clean',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.cleanCacheHandler);

        return this.slot;
    }
}

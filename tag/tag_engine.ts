import {CacheEngine} from "../cache.engine/cache_engine";
import {DataBaseService} from "../db/sql";
import {Context} from "../search/config";


export class TagEngine {
    ce: CacheEngine;
    dbe: DataBaseService;
    constructor(context: Context) {
        context.tagEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }
}

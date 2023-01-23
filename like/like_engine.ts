import {CacheEngine} from "../cache.engine/cache_engine";
import {DataBaseService} from "../db/sql";
import {Context} from "../search/config";


export class LikeEngine {
    ce: CacheEngine;
    dbe: DataBaseService;
    constructor(context: Context) {
        context.likeEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }
}

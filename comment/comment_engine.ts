import {CacheEngine} from "../cache.engine/cache_engine";
import {DataBaseService} from "../db/sql";
import {Context} from "../search/config";


export class CommentEngine {
    ce: CacheEngine;
    dbe: DataBaseService;
    constructor(context: Context) {
        context.commentEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }
}

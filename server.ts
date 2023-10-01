import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from 'cors';
import fs from 'fs';
import {CacheEngine} from "./cache.engine/cache_engine";
import {SearchEngine} from "./search/engine";
import {DictionaryEngine} from "./dictionary/dictionary_engine";
import {Context} from "./search/config";
import {AuthorizationEngine} from "./auth/auth.engine";
import {DataBaseService} from "./db/sql";
import {EntityEngine} from "./entity/entity_engine";
import {ContainerEngine} from "./container/container_engine";
import {SlotEngine} from "./slot/slot_engine";
import { ConfigEngine } from "./config/config_engine";
import { getAdminMiddleware } from "./api/admin_rest";
import { getAPIMiddleware } from "./api/api_rest";
import { OrderEngine } from "./orders/orders_engine";
import {CommentEngine} from "./comment/comment_engine";
import {LikeEngine} from "./like/like_engine";
import {TagEngine} from "./tag/tag_engine";
import {FeedbackEngine} from "./feedback/feedback_engine";
import {VoteEngine} from "./vote/vote_engine";

// context
const context: Context = {
    cacheEngine: null,
    searchEngine: null,
    dictionaryEngine: null,
    authorizationEngine: null,
    dbe: null,
    entityEngine: null,
    entityEngineAdmin: null,
    containerEngine: null,
    slotEngine: null,
    configEngine: null,
    orderEngine: null,
    commentEngine: null,
    likeEngine: null,
    tagEngine: null,
    feedbackEngine: null,
    voteEngine: null,
}

// providers
const CE = new CacheEngine(context);
const DBE = new DataBaseService(context);
const DE = new DictionaryEngine(context);
const SE = new SearchEngine(context);
const AE = new AuthorizationEngine(context);
const EE: EntityEngine = new EntityEngine(context);
const EEA: EntityEngine = new EntityEngine(context, true);
const CNE: ContainerEngine = new ContainerEngine(context);
const SLE: SlotEngine = new SlotEngine(context);
const CFGE: ConfigEngine = new ConfigEngine(context);
const OE: OrderEngine = new OrderEngine(context);
const COME: CommentEngine = new CommentEngine(context);
const LE: LikeEngine = new LikeEngine(context);
const TE: TagEngine = new TagEngine(context);
const FBE: FeedbackEngine = new FeedbackEngine(context);
const VE: VoteEngine = new VoteEngine(context);

const app = express();
function jsonHeaders(req, res, next) {
    res.contentType('json');
    next();
}
function imageHeaders(res) {
    res.set('maxAge', ''+oneWeek);
    res.type("jpg");
}
const oneWeek = 604800000;
app.use(cors());
app.use('/search', jsonHeaders, context.searchEngine.getRouter());
app.use('/admin', jsonHeaders, getAdminMiddleware(context));
app.use('/api', jsonHeaders, getAPIMiddleware(context));
app.use('/order', jsonHeaders, context.orderEngine.getRouter());
app.use('/auth', jsonHeaders, context.authorizationEngine.getRouter());
app.use('/static', express.static('/usr/src/app/uploads/',{ fallthrough: false, maxAge: oneWeek, setHeaders: imageHeaders }), (err, req, res, next) => {
    // console.log('err static:', err);
    if(err.status === 404){
        // console.log('Error 404 отдаем заглушку');
        fs.createReadStream('assets/noimage.png').pipe(res);
    }
});

app.listen(3000, function () {
    console.log('Birthhelper service listening on port 3000!');
  });

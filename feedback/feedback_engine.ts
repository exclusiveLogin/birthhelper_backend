import * as express from "express";
import {CacheEngine} from "../cache.engine/cache_engine";
import {Request, Response, Router} from "express";
import {Observable, throwError} from "rxjs";
import {generateFilterQStr} from "../db/sql.helper";
import {DataBaseService} from "../db/sql";
import {Context} from "../search/config";


export class FeedbackEngine {
    private feedback = express.Router();
    ce: CacheEngine;
    dbe: DataBaseService;
    constructor(context: Context) {
        context.feedbackEngine = this;
        this.ce = context.cacheEngine;
        this.dbe = context.dbe;
    }

    sendError = (res: Response, err): void => {
        console.log('DICT error: ', err);
        res.status(500);
        res.end(JSON.stringify({error: err}));
    }

    getRouter(): Router {
        return this.feedback.get('/:id', (req, res) => {

        });
    }
}

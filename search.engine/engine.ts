import express = require('express');
import {Router} from "express";
import {CacheEngine} from "../cache.engine/cache_engine";

export class SearchEngine {

    router: Router = express.Router();
    cache: CacheEngine;

    constructor() {

    }

    createVector(req, res, next): void {

    }

    rootHandler(req, res){
        res.send({index: 'search root index'});
    }

    getRouter(_: CacheEngine): Router {
        this.cache = _;
        this.router.get('/', this.rootHandler);
        this.router.post('/', this.createVector);

        return this.router;
    }


}

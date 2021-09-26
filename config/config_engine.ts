import * as express from "express";
import { Response, Router } from "express";
import { Observable, of, throwError } from "rxjs";
import { Context, SectionKeys } from "../search.engine/config";
import { Config, config } from "./config_repo";



export class ConfigEngine {
    private configRouter = express.Router();

    constructor(context: Context) {
        context.configEngine = this;
    }

    getConfig(id: SectionKeys): Observable<Config> {
        return config[id] ? of(config[id]) : throwError(`Конфиг для секции ${id} не найден`);
    }

    sendError = (res: Response, err): void => {
        console.log('Congif error: ', err);
        res.status(500);
        res.end(JSON.stringify({ error: err}));
    }

    getRouter(): Router {
        return this.configRouter.get('/:id', (req, res) => {
            const id = req.params.id as SectionKeys;
            const configProvider = this.getConfig(id);

            configProvider.subscribe((data) => res.send(data), (error) => this.sendError(res, error));
        });
    }
}

import * as express from "express";
import { Response, Router } from "express";
import { Context, SectionKeys } from "../search.engine/config";
import { Config, config, Consumer, SelectMode, TabFloorSetting } from "./config_repo";



export class ConfigEngine {
    private configRouter = express.Router();
    private ctx: Context;

    constructor(context: Context) {
        context.configEngine = this;
        this.ctx = context;
    }

    async getConfig(id: SectionKeys): Promise<Config> {
        const cfg = config[id];
        if (cfg) {
            // mutate config if needed
            for ( const consumer of cfg.consumers) {
                if(consumer?.restrictorsDict?.dictKey){
                    const dict = await this.ctx.dictionaryEngine.getDict(consumer?.restrictorsDict?.dictKey).toPromise();
                    for (const dictItem of dict) {
                        const fieldKey = consumer.restrictorsDict.entityFieldKey;
                        const key = `${consumer.key}_${dictItem.id}`;
                        const required = consumer?.restrictorsDict?.required?.some(r => r === dictItem.id) ?? false;
                        const selectMode: SelectMode = consumer?.restrictorsDict?.selectModeMap?.find(sm => sm.id === dictItem.id)?.selectMode ?? 'multi';
                        const targetConsumer: Consumer =  {...consumer, restrictorsDict: null, key, restrictors: [{ key: fieldKey, value: dictItem.id}]};
                        const targetFloor: TabFloorSetting = { ...consumer?.restrictorsDict?.floorSettings, consumerKeys: [key], required, selectMode, key, title: dictItem.title };
                        const curIdxFloor = consumer?.restrictorsDict?.orders?.indexOf(dictItem.id) ?? -1;
                        const targetTab = cfg.tabs.find(t => t.key === consumer.restrictorsDict.tabKey);
                        if (targetTab) {
                            targetTab.floors[curIdxFloor > -1 ? curIdxFloor : targetTab.floors.length] = targetFloor;
                        }
                        delete cfg.consumers[cfg.consumers.indexOf(consumer)];
                        cfg.consumers.push(targetConsumer);
                        cfg.consumers = [...cfg.consumers.filter(c => !!c)];
                    }
                }
            }
            return Promise.resolve(cfg);
        } else {
            return Promise.reject(`Конфиг для секции ${id} не найден`);
        }
    }

    sendError = (res: Response, err): void => {
        console.log('Congif error: ', err);
        res.status(500);
        res.end(JSON.stringify({ error: err}));
    }

    getRouter(): Router {
        return this.configRouter.get('/:id', async (req, res) => {
            const id = req.params.id as SectionKeys;
            try {
                const config = await this.getConfig(id);
                res.send(config);
            } catch (error) {
                this.sendError(res, error)
            }
        });
    }
}

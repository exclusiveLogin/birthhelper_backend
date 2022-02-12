import * as express from "express";
import {Context, SectionKeys} from "../search/config";
import {Request, Response, Router} from "express";
import {Slot, slots} from "../slot/slot_repo";
import {Entity, FilterParams} from "../entity/entity_engine";
import {forkJoin} from "rxjs";
import {ContragentSlots, SectionedContragentSlots, uniq} from "../models/common";
import {map, tap} from "rxjs/operators";
import {config} from "../config/config_repo";
import {EntityKeys} from "../entity/entity_repo.model";
import {getIdByRequest} from "../db/sql.helper";

// const jsonparser = bodyParser.json();

export class SlotEngine {
    slot = express.Router();

    constructor(private context: Context) {
        this.context.slotEngine = this;
    }

    getSlotParams(name: string): Slot {
        return !!slots[name] ? slots[name] : null;
    }

    hasSlotParams(name: string): boolean {
        return !!slots[name];
    }

    // функция возвращающая список существующих в системе контейнеров
    getSlotListHandler(req, res) {
        res.send(Object.keys(slots).map(k => slots[k]));
    }

    async getSlotsByContragent(contragentID: number | string): Promise<SectionedContragentSlots> {
        if (!contragentID) { throw new Error('Не передан ID контрагента'); }
        const filters: FilterParams = {contragent_id: contragentID.toString(), active: '1'};
        const sections: SectionKeys[] = [];
        const configEngine = this.context.configEngine;
        // получение sections у КА

        const dataStorage: {[key in EntityKeys]?: Entity[]} = {};
        const result: SectionedContragentSlots = {};

        try {
            // get ContragentEntity
            await this.context.entityEngine.getEntitiesByIds([+contragentID], "ent_contragents").pipe(
                map(list => list?.[0]),
                tap(contragent => {
                    if (!!contragent?.['section_clinic']) {
                        sections.push('clinic');
                    }
                }),
            ).toPromise();

            // получение слотов из конфигуратора уникальных ent_name
            const slotsKeys = sections
                .map(key => config[key].providers)
                .reduce((acc, cur) => [...acc, ...cur.map(p => p.entityKey)], [] as EntityKeys[]);
            const slotKeys = uniq(slotsKeys) as EntityKeys[];

            // получение сущностей
            const providers = slotKeys.map(slotKey => this.context.entityEngine
                .getEntities(slotKey, null, filters).pipe(
                    tap(list => dataStorage[slotKey] = list)));

            await forkJoin(providers).toPromise();

            // prepare result
            for (const section of sections) {
                const config = await configEngine.getConfig(section);
                result[section] = {
                    tabs: config.tabs.map(t => ({
                        key: t.key,
                        title: t.title,
                        floors: t.floors.map(f => ({
                            key: f.key,
                            title: f.title,
                            list: f.consumerKeys
                                .map(ck => config.consumers.find(c => c.key === ck) ?? null)
                                .filter(_ => !!_)
                                .map(consumer => ({entKey: consumer.entityKey, restrictors: consumer.restrictors}))
                                .map(state => {
                                    const data = dataStorage[state.entKey] ?? [];
                                    data.forEach(item => item['__entity_key'] = state.entKey);
                                    const restrictors = state.restrictors;
                                    return data.filter(ent => restrictors.length ? restrictors.every(r => ent._entity[r.key] === r.value) : true)
                                }).flat(),
                            utility: f.entityType,
                        }))
                    })),
                } as ContragentSlots
            }
        }
         catch (e) {
            throw new Error(e);
        }

        return result;
    }

    validator(data, name) { // все ли поля необходимые пришли на бек
        const params: Slot = this.getSlotParams(name);
        if(!(data && params)) return false;

        console.log('validator: ', data, params.required_fields);
        const reqFields = params.required_fields;
        return reqFields.every(rf => !!data[rf]);
    }

    garbageHandler(keys: string[], sections: SectionKeys[]): void {
        keys.forEach(k => this.context.cacheEngine.softClearBykey(k));
        sections.forEach(k => this.context.searchEngine.resetSearchStoreBySection(k));
        sections.forEach(k => this.context.searchEngine.resetSummaryStoreBySection(k));
    }

    async getSlotsByContragentHandler(req: Request, res: Response) {
        const contragentId = getIdByRequest(req);
        try {
            const result = await this.getSlotsByContragent(contragentId);
            res.send(result);
        } catch (error) {
            res.status(500);
            res.send(JSON.stringify({error}));
        }

    }

    getRouter(): Router {

        this.slot.get('/',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.getSlotListHandler);

        this.slot.get('/contragent/:id',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.getSlotsByContragentHandler.bind(this));

        return this.slot;
    }
}



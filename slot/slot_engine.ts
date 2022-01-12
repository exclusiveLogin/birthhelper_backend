import * as express from "express";
import bodyParser from "body-parser";
import {Context, SectionKeys} from "../search/config";
import {Request, Response, Router} from "express";
import {Slot, slots} from "../slot/slot_repo";
import {Entity, FilterParams} from "../entity/entity_engine";
import {forkJoin} from "rxjs";
import {Sectioned, TitledList, uniq} from "../models/common";
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

    async getSlotsByContragent(contragentID: number | string): Promise<Sectioned<TitledList<Entity>[]>> {
        if (!contragentID) { throw new Error('Не передан ID контрагента'); }
        const filters: FilterParams = {contragent_id: contragentID.toString()};
        const sections: SectionKeys[] = [];
        // получение sections у КА

        const tree: {[section in SectionKeys]?: EntityKeys[]} = {};
        const dataStorage: {[key in EntityKeys]?: Entity[]} = {};
        try {
            await this.context.entityEngine.getEntitiesByIds([+contragentID], "ent_contragents").pipe(
                map(list => list?.[0]),
                tap(contragent => {
                    if(!!contragent?.['section_clinic']) {
                        sections.push('clinic');
                    }
                }),
            ).toPromise();
            // подготовка дерева проходки
            sections.forEach(key => tree[key] = config[key].providers.map(p => p.entityKey));

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
        } catch (e) {
            throw new Error(e);
        }

        const result: Sectioned<TitledList<Entity>[]> = {}
        Object.keys(tree).forEach((section: SectionKeys) => {
            const sectionSlotsKeys = tree[section];
            result[section] = sectionSlotsKeys.map(k => ({
                key: k,
                title: config[section].providers.find(prov => prov.entityKey === k).title,
                list: dataStorage?.[k] ?? [],
            }));
        });

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
        } catch (e) {
            res.status(500);
            res.send(JSON.stringify({e}));
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



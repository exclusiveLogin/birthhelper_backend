import * as express from "express";
import bodyParser from "body-parser";
import {Context, SectionKeys} from "../search/config";
import {Router} from "express";
import {Slot, slots} from "../slot/slot_repo";

const jsonparser = bodyParser.json();

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

    getRouter(): Router {

        this.slot.get('/',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.getSlotListHandler);

        return this.slot;
    }
}



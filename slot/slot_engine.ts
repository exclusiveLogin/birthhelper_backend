import * as express from "express";
import bodyParser from "body-parser";
import {Context, SectionKeys} from "../search.engine/config";
import {Router} from "express";
import {Entity} from "../entity/entity_engine";
import {Slot, slots} from "../slot/slot_repo";
import {mapTo, tap} from "rxjs/operators";

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

    // получение entity или контейнера слота
    async getSlotItems(slotParams, r): Promise<Entity[]> {
        const id = r[slotParams.entity_id_key];
        let qi = null;
        switch (r.type) {
            case 'entity':
                qi = `SELECT 'id',
                    ${slotParams.entity_fields.map(f => `\`${slotParams.db_entity}\`.\`${f}\``).join(', ')} 
                    FROM \`${slotParams.db_entity}\`
                    WHERE \`id\`= ${id}`;
                break;
            case 'container':
                qi = `SELECT 
                    \`${slotParams.db_entity}\`.\`id\`,
                    ${slotParams.entity_fields.map(f => `\`${slotParams.db_entity}\`.\`${f}\``).join(', ')} 
                    FROM \`${slotParams.db_container}\`
                    LEFT JOIN \`${slotParams.db_entity}\`
                    ON \`${slotParams.db_container}\`.\`${slotParams.entity_id_key}\` = \`${slotParams.db_entity}\`.\`id\`
                    WHERE \`${slotParams.db_container}\`.\`container_id\`=${id}`;
                break;
        }

        console.log('qi: ', qi);
        return qi ? this.context.dbe.query<Entity>(qi).toPromise() : [];

    }

    async getSlotContainer(slotParams, r): Promise<any[]> {
        let qr;
        if (r.type === 'container') {
            qr = `SELECT 
            \`${slotParams.db_repo}\`.\`id\`,
            ${slotParams.container_fields.map(f => `\`${slotParams.db_repo}\`.\`${f}\``).join(', ')} 
            FROM \`${slotParams.db_repo}\`
            WHERE \`${slotParams.db_repo}\`.\`id\`=${r[slotParams.entity_id_key]}`;
        }

        console.log('query getSlotContainer: ', qr);

        return qr ? this.context.dbe.query(qr).toPromise() : [];
    }

    // Функция возвращающая список слотов или слот по id
    async getSlotRepo(name: string, cid?: string) {
        const params: Slot = this.getSlotParams(name);
        const whereStr = cid ? `WHERE \`id\`=${cid}` : '';
        const q = 'SELECT * FROM `' + params.db_links + '`' + whereStr;

        return this.context.dbe.query(q).toPromise();
    }

    // функция возвращающая слот по id с наполнением
    async getSlot(name: string, cid?: string): Promise<any[]> {
        const params: Slot = this.getSlotParams(name);
        try {
            const repo = await this.getSlotRepo(name, cid);
            await Promise.all(repo.map(async r => {
                r['container'] = await this.getSlotContainer(params, r);
                r['entities'] = await this.getSlotItems(params, r);
            }));

            return repo;

        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getSlotHandler(req, res) {
        console.log('getSlot', req.params);
        const name = req.params.name;
        const slotParams = slots[name];
        const cid = req.params.cid;

        if (!slotParams) {
            res.status(500);
            res.end(JSON.stringify({error: 'ошибка доступа : не указан slot'}));
            console.warn('ошибка доступа : не указан slot');
            return;
        }



        if (slotParams?.db_entity && slotParams?.db_links) {
            try {
                res.send(await this.getSlot(slotParams.name, cid));
            } catch (e) {
                res.status(500);
                res.send(JSON.stringify({error: e}));
            }

        } else {
            res.status(500);
            res.send(JSON.stringify({error: 'ошибка доступа : Запрошенный slot не существует'}));
            console.warn('ошибка доступа : Запрошенный slot не существует');
        }
    }

    async saveSlot(name, data, slot_id?: string) {
        const params: Slot = this.getSlotParams(name);
        console.log('save slot:', params, name, data);

        const db = params.db_links;
        const createSections = params.createAffectionSectionKeys ?? [];

        let valArr = !slot_id ?
            Object.keys(data).map(datakey => {
                const targetType = params.required_fields_type && params.required_fields_type[datakey];
                if (!targetType) return `"${data[datakey]}"`;
                return targetType === 'string' ? `"${data[datakey]}"` : data[datakey];
            }) :
            Object.keys(data).map(datakey => {
                const targetType = params.required_fields_type && params.required_fields_type[datakey];
                if (!targetType) return `"${data[datakey]}"`;
                return targetType === 'string' ? `\`${datakey}\` = "${data[datakey]}"` : `\`${datakey}\` = ${data[datakey]}`;
            });

        console.log('valArr: ', valArr, 'slot_id: ', name);

        let q = !slot_id ?
            `INSERT INTO \`${ db }\` (\`${ Object.keys(data).join('\`, \`') }\`) VALUES ( ${ valArr.join(',') } )` :
            `UPDATE \`${ db }\` SET ${ valArr.join(', ') } WHERE \`id\` = ${slot_id}`;

        console.log('saveSlot q: ', q);

        return this.context.dbe.query(q)
            .pipe(
                mapTo(`${slot_id ? 'слот с id ' + slot_id + ' изменен' : 'добавлен новый слот'}`),
                tap(() => this.garbageHandler([name, params.db_entity, params.entity_key, ...createSections], createSections))
            ).toPromise();
    }

    async saveSlotHandler(req, res) {
        console.log('saveSlotHandler body: ', req.body, ' params: ', req.params);
        const slotName = req.params.name;
        //проверка валидности ключа сущности для контейнера
        const slot_id = req.params.sid;
        const data = req.body;

        if (this.validator(data, slotName)) {

            try {
                const result = await this.saveSlot(slot_id, data);
                res.send({status: result});
            } catch (e) {
                res.status(500);
                res.send({error: e});
            }

        } else {
            res.status(500);
            res.send({error: 'Ошибка в переданных данных, уточните запрос'});
            }
    }

    validator(data, name) { // все ли поля необходимые пришли на бек
        const params: Slot = this.getSlotParams(name);
        if(!(data && params)) return false;

        console.log('validator: ', data, params.required_fields);
        const reqFields = params.required_fields;
        return reqFields.every(rf => !!data[rf]);
    }

    async deleteSlot(name: string, id: string) {
        const params: Slot = this.getSlotParams(name);
        const db_repo = params.db_links;
        const deleteSections = params.deleteAffectionSectionKeys ?? [];

        const qd = `DELETE FROM \`${ db_repo }\` WHERE id=${id}`;

        console.log('deleteSlot qd: ', qd);

        return this.context.dbe.query(qd)
            .pipe(
                mapTo('Слот с name: ' + params.name + ' и id: ' + id + ' удален из репозитория'),
                tap(() => this.garbageHandler([name, params.db_entity, params.entity_key, ...deleteSections], deleteSections))
            ).toPromise();
    }

    async deleteSlotHandler(req, res) {
        if (req.params.sid && req.params.name) {
            console.log('delete params:', req.params);
            const sid = req.params.sid;
            const name = req.params.name;

            if (this.hasSlotParams(name)) {
                try {
                    const result = await this.deleteSlot(name, sid);
                    res.send({status: result});
                } catch (e) {
                    res.status(500);
                    res.send({error: e});
                }
            } else {
                res.status(500);
                res.send({error: 'слот не найден'});
            }
        }
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

        this.slot.get('/:name',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, null),
            this.getSlotHandler.bind(this));

        this.slot.post('/:name/',
            jsonparser,
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.saveSlotHandler.bind(this));

        this.slot.post('/:name/:sid',
            jsonparser,
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.saveSlotHandler.bind(this));

        this.slot.delete('/:name/:sid',
            this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7),
            this.deleteSlotHandler.bind(this));

        return this.slot;
    }
}



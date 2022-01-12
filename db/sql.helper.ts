
import {entityRepo} from "../entity/entity_repo";
import {IDictionaryFilters} from "../dictionary/dictionary_repo";
import { FilterParams } from "../entity/entity_engine";
import { Entity } from "../entity/entity_repo.model";
import { Request } from "express";
const entities = entityRepo;

export type reqType = 'string' | 'id' | 'flag';
export type qstrType = 'entity' | 'dictionary';

export function concatFn(arrA, arrB, isStr?: boolean) {
    // console.log('A:', arrA, 'B:', arrB);
    if (arrA && arrA.length && arrB && arrB.length) {
        let fine = [];
        for (let i = 0; i < arrA.length; i++) {
            fine.push((isStr ? `${arrA[i]} LIKE "%${arrB[i]}%"` : `${arrA[i]} = ${arrB[i]}`));
        }

        // console.log('concatFn fine:', fine);
        return fine;
    }
    return [];
}

export function generateFilterQStr(filters: IDictionaryFilters[], type: reqType): string[] {
    const filtered: IDictionaryFilters[] = [];
    const keys = [];
    const values = [];


    if (type === 'id') {
        filtered.push(
            ...filters.filter(k => k.type === 'number')
        );

        if(!filtered.length) return [];
        keys.push(filtered.map( k => k.key ));
        values.push(filtered.map( k => k.value ));

        return concatFn(keys, values);
    }

    if (type === 'string') {
        filtered.push(
            ...filters.filter(k => k.type === 'string')
        )

        if(!filtered.length) return [];
        keys.push(filtered.map( k => k.key ));
        values.push(filtered.map( k => `${k.value}`));

        return concatFn(keys, values, true);
    }

    if (type === 'flag') {
        filtered.push(
            ...filters.filter(k => k.type === 'flag')
        )

        if(!filtered.length) return [];
        keys.push(filtered.map( k => k.key ));
        values.push(keys.map( k => `${ (k.value as any as boolean) == true ? '1' : '0'}` ));

        return concatFn(keys, values, true);
    }

}

export function getFiltersByRequest(req: Request): FilterParams {
    return req.query as unknown as FilterParams || {}
}

export function getIdByRequest(req: Request): string {
    return req?.params?.id;
}

export function generateQStr(key: string, filters: FilterParams, type: reqType): string[] {
    const config: Entity = entities[key];

    if (!!config) {
        const fields = config.fields;
        let filtered = Object.keys(filters)
            .filter(k => !(k === 'skip' || k === 'limit'));

        const overrideKeys = config.filters
            .reduce((a, c) => [...a, ...c?.overrideKeys ?? []], [] );

        overrideKeys.forEach(k => {
            const idx = filtered.indexOf(k);
            if(idx !== -1) {
                filtered.splice(idx, 1);
            }
        });

        // console.log('filtered', filtered, overrideKeys);

        const keys = [];
        const values = [];

        if (type === 'id') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'id'))
            );
            values.push(...keys.map(k => filters[k]));
            return concatFn(keys, values);
        }

        if (type === 'string') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'string'))
            );
            values.push(...keys.map(k => `${filters[k]}`));
            return concatFn(keys, values, true);
        }

        if (type === 'flag') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'flag'))
            );
            values.push(...keys.map(k => `${(filters[k] as any as boolean) == true ? '1' : '0'}`));
            return concatFn(keys, values, true);
        }
    }
}

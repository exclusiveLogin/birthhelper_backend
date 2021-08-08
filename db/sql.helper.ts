import {Request} from "express";
import {entityRepo} from "../entity/entity_repo";
const entities = entityRepo;

export type reqType = 'string' | 'id' | 'flag';

export function concatFn(arrA, arrB, isStr?: boolean) {
    console.log('A:', arrA, 'B:', arrB);
    if (arrA && arrA.length && arrB && arrB.length) {
        let fine = [];
        for (let i = 0; i < arrA.length; i++) {
            fine.push((isStr ? `${arrA[i]} LIKE "%${arrB[i]}%"` : `${arrA[i]} = ${arrB[i]}`));
        }
        return fine;
    }
    return [];
}

export function generateQStr(req: Request, type: reqType): string[] {
    if (!!entities[req.params.id]) {
        const fields = entities[req.params.id].fields;
        const filtered = Object.keys(req.query).filter(k => !(k === 'skip' || k === 'limit'));

        const keys = [];
        const values = [];

        if (type === 'id') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'id'))
            );
            values.push(keys.map(k => req.query[k]));
            return concatFn(keys, values);
        }

        if (type === 'string') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'string'))
            );
            values.push(keys.map(k => `${req.query[k]}`));
            return concatFn(keys, values, true);
        }

        if (type === 'flag') {
            keys.push(
                ...filtered.filter(k => (fields.some(f => f.key === k) && fields.find(f => f.key === k).type === 'flag'))
            );
            values.push(keys.map(k => `${(req.query[k] as any as boolean) == true ? '1' : '0'}`));
            return concatFn(keys, values, true);
        }
    }
}

const md = require('md5');

type RelationType = `simple` | `grouped`;

export const cacheKeyGenerator =  (from: string, by: string, id: number | number[], type: RelationType = 'simple', groupKey?: string): string => {
    console.log('tick, cacheKeyGenerator', from, by, id, type, groupKey);
    return `${from}.${by}_${Array.isArray(id) ? '['+id.join(',')+']' :  id}${type === "grouped" ? '_groupby_'+groupKey : ''}`;
}

export function md5Encript(body: object): string {
    const str = JSON.stringify(body);
    return md(str);
}

export function genarateAverage() {}

export function genarateRange() {}

export function genarateTotal() {}

export function genarateDistinct() {}


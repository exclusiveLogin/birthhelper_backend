const md = require('md5');

type RelationType = `simple` | `grouped`;

export const cacheKeyGenerator =  (from: string, by: string, id: number | number[], type: RelationType = 'simple', groupKey?: string): string => {
    return `${from}.${by}_${typeof id === "number" ? id : '['+id.join(',')+']'}${type === "grouped" ? '_groupby_'+groupKey : ''}`;
}

export function md5Encript(body: object): string {
    const str = JSON.stringify(body);
    return md(str);
}

export function genarateAverage() {}

export function genarateRange() {}

export function genarateTotal() {}

export function genarateDistinct() {}


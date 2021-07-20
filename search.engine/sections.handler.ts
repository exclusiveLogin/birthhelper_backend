const md = require('md5');

export const cacheKeyGenerator =  (from: string, by: string, type = 'one_many', id: number): string => {
    return `${from}.${by}_${id}`;
}

export function md5Encript(body: object): string {
    const str = JSON.stringify(body);
    return md(str);
}

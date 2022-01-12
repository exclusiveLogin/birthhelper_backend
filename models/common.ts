import {SectionKeys} from "../search/config";

export interface TitledList<T> {
    title: string;
    key: string;
    list: T[];
}

export type Sectioned<T> = {
    [section in SectionKeys]?: T
}

export function uniq(items: (number | string)[]): string[] {
    const str = items.map(i => i.toString());
    return [...new Set(str)];
}

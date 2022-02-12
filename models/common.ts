import {SectionKeys} from "../search/config";
import {Entity} from "../entity/entity_engine";
import {Config, EntityType} from "../config/config_repo";
import {EntityKeys} from "../entity/entity_repo.model";

export interface TitledList<T> {
    title: string;
    key: string;
    list: T[];
}

export type Sectioned<T> = {
    [section in SectionKeys]?: T
}

export interface TabedSlots {
    key: string;
    title: string;
    floors: ({utility: EntityType} & TitledList<Entity>)[]
}
export interface ContragentSlots {
    tabs: TabedSlots[];
}

export type SectionedContragentSlots = Sectioned<ContragentSlots>;

export function uniq(items: (number | string)[]): string[] {
    const str = items.map(i => i.toString());
    return [...new Set(str)];
}

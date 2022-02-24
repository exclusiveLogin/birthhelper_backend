import { EntityKeys } from "../entity/entity_repo.model";
import { SectionKeys } from "../search/config";
import { Restrictor } from "../slot/slot_repo";
import {ClinicConfig} from "./entity/clinic.config";
import {ConsultationConfig} from "./entity/consultation.config";

export type PriorityFloor = 'high' | 'mid' | 'low';

export interface Provider {
    key: string;
    busKey: string;
    entityKey: EntityKeys;
    restrictors: Restrictor[];
    title?: string; // используется в ЛК
}

export interface RestrictorDictConfig {
    dictKey: string;
    tabKey: string;
    floorSettings: TabFloorSetting;
    entityFieldKey: string;
    idKey?: string;
    titleKey?: string;
    orders?: number[]; // ids orders in dict prediction
    required?: number[];// ids required dict category
    selectModeMap?: {id: number, selectMode: SelectMode}[];
}
export interface Consumer {
    title: string;
    key: string;
    busKey: string;
    entityKey: string;
    restrictors?: Restrictor[]; // temporary unused
    restrictorsDict?: RestrictorDictConfig;
    priority?: PriorityFloor;
}

export type SelectMode = 'multi' | 'single';
export interface TabConfig {
    key: string;
    title: string;
    floors: TabFloorSetting[];
    required?: boolean;
    selectMode?: SelectMode;
    poorErrorMessage?: string;
    richErrorMessage?: string;
    lockMessage?: string;
    defaultMessage?: string;
}

export type EntityType = 'person' | 'placement' | 'other';

export interface TabFloorSetting {
    key: string;
    title: string;
    consumerKeys: string[];
    required?: boolean;
    selectMode?: SelectMode;
    entityType?: EntityType;
    poorErrorMessage?: string;
    richErrorMessage?: string;
    lockMessage?: string;
    defaultMessage?: string;
}

export interface Config {
    providers: Provider[];
    consumers: Consumer[];
    tabs: TabConfig[];
}

export const config: { [key in SectionKeys]: Config } = {
    clinic: ClinicConfig,
    consultation: ConsultationConfig,
};

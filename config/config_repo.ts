import { EntityKeys } from "../entity/entity_repo.model";
import { SectionKeys } from "../search.engine/config";
import { Restrictor } from "../slot/slot_repo";

export type PriorityFloor = 'high' | 'mid' | 'low';

export interface Provider {
    key: string;
    busKey: string;
    entityKey: EntityKeys;
    restrictors: Restrictor[];
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

export interface TabFloorSetting {
    key: string;
    title: string;
    consumerKeys: string[];
    required?: boolean;
    selectMode?: SelectMode;
    entityType?: 'person' | 'placement' | 'other';
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
    clinic: {
        providers: [
            {
                key: 'doctors',
                busKey: 'bus_doctors_any',
                entityKey: 'ent_doctor_slots',
                restrictors: [],
            },
            {
                key: 'placement',
                busKey: 'bus_placement_any',
                entityKey: 'ent_placement_slots',
                restrictors: [],
            },
            {
                key: 'birthtype',
                busKey: 'bus_birthtype_any',
                entityKey: 'ent_birth_type_slots',
                restrictors: [],
            },
            {
                key: 'other',
                busKey: 'bus_other_any',
                entityKey: 'ent_birth_additional_slots',
                restrictors: [],
            },
        ],
        consumers: [
            {
                key: 'doctors1',
                title: null,
                busKey: 'bus_doctors_any',
                entityKey: 'ent_doctor_slots',
                priority: 'mid',
                restrictorsDict: {
                    dictKey: 'dict_doctor_position_type',
                    tabKey: 'doctors',
                    entityFieldKey: 'position',
                    required: [1],
                    floorSettings: {
                        key: null,
                        title: null,
                        entityType: 'person',
                        consumerKeys: [],
                        required: true,
                        selectMode: 'single',
                        defaultMessage: 'Вы можете выбрать не более одного специалиста',
                        poorErrorMessage: 'Необходимо выбрать минимум одного специалиста',
                        lockMessage: 'Вы уже выбрали необходимого специалиста',
                    }
                }
            },
            {
                key: 'placement',
                title: null,
                busKey: 'bus_placement_any',
                entityKey: 'ent_placement_slots',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'birthtype',
                title: null,
                busKey: 'bus_birthtype_any',
                entityKey: 'ent_birth_type_slots',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'other',
                title: null,
                busKey: 'bus_other_any',
                entityKey: 'ent_birth_type_slots',
                priority: 'mid',
                restrictors: [],
            },

        ],
        tabs: [
            {
                key: 'doctors',
                title: 'Специалисты',
                selectMode: 'single',
                floors: [],
            },
            {
                key: 'placement',
                title: 'Размещение',
                selectMode: 'multi',
                floors: [
                    {
                        key: 'placement',
                        title: null,
                        entityType: 'placement',
                        consumerKeys: ['placement'],
                        required: true,
                    },
                ],
            },
            {
                key: 'birthtype',
                title: 'Вид родов',
                selectMode: 'multi',
                floors: [
                    {
                        key: 'birthtype',
                        title: null,
                        entityType: 'other',
                        consumerKeys: ['birthtype'],
                        required: true,
                    },
                ],
            },
            {
                key: 'other',
                title: 'Дополнительные услуги',
                selectMode: 'multi',
                floors: [
                    {
                        key: 'other',
                        title: null,
                        entityType: 'other',
                        consumerKeys: ['other'],
                        required: true,
                    },
                ],
            },
        
        ],
        
    }
};

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

export interface Consumer {
    title: string;
    key: string;
    busKey: string;
    entityKey: string;
    restrictors?: Restrictor[]; // temporary unused
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
        ],
        consumers: [
            {
                key: 'doctors1',
                title: null,
                busKey: 'bus_doctors_any',
                entityKey: 'ent_doctor_slots',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'doctors2',
                title: null,
                busKey: 'bus_doctors_any',
                entityKey: 'ent_doctor_slots',
                priority: 'mid',
                restrictors: [],
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

        ],
        tabs: [
            {
                key: 'doctors',
                title: 'Специалисты',
                selectMode: 'single',
                floors: [
                    {
                        key: 'doctors',
                        title: 'Акушеры',
                        entityType: 'person',
                        consumerKeys: ['doctors1'],
                        required: true,
                        selectMode: 'single',
                        defaultMessage: 'Вы можете выбрать не более одного специалиста',
                        poorErrorMessage: 'Необходимо выбрать минимум одного специалиста',
                        lockMessage: 'Вы уже выбрали необходимого специалиста',
                    },
                ],
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
                        key: 'other',
                        title: null,
                        entityType: 'other',
                        consumerKeys: ['birthtype'],
                        required: true,
                    },
                ],
            },
        
        ],
        
    }
};

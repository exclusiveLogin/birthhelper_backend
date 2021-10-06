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
    restrictors?: Restrictor[];
    priority?: PriorityFloor;
}

export interface TabConfig {
    key: string;
    title: string;
    floors: TabFloorSetting[];
    required?: boolean;
}

export interface TabFloorSetting {
    title: string;
    consumerKeys: string[];
    required?: boolean;
    entityType?: 'person' | 'placement' | 'other';
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
                floors: [
                    {
                        title: 'Акушеры',
                        entityType: 'person',
                        consumerKeys: ['doctors1'],
                        required: true,
                    },
                ],
            },
            {
                key: 'placement',
                title: 'Размещение',
                floors: [
                    {
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
                floors: [
                    {
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

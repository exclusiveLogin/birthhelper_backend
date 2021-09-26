import { EntityKeys } from "../entity/entity_repo.model";
import { SectionKeys } from "../search.engine/config";
import { Restrictor } from "../slot/slot_repo";

export type PriorityFloor = 'high' | 'mid' | 'low';

export interface Provider {
    key: string;
    busKey: string;
    entityKey: EntityKeys;
    filters: Restrictor[];
}

export interface Consumer {
    title: string;
    key: string;
    busKey: string;
    entityType?: 'person' | 'placement' | 'other';
    restrictors?: Restrictor[]
    priority?: PriorityFloor;
}

export interface TabConfig {
    key: string;
    title: string;
    floors: TabFloorSetting[];
}

export interface TabFloorSetting {
    title: string;
    consumerKeys: string[];
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
                filters: [],
            },
            {
                key: 'placement',
                busKey: 'bus_placement_any',
                entityKey: 'ent_placement_slots',
                filters: [],
            },
            {
                key: 'birthtype',
                busKey: 'bus_birthtype_any',
                entityKey: 'ent_birth_type_slots',
                filters: [],
            },
        ],
        consumers: [
            {
                key: 'doctors',
                entityType: 'person',
                title: null,
                busKey: 'bus_doctors_any',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'placement',
                entityType: 'placement',
                title: null,
                busKey: 'bus_placement_any',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'birthtype',
                entityType: 'other',
                title: null,
                busKey: 'bus_birthtype_any',
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
                        title: null,
                        consumerKeys: ['doctors'],
                    },
                ]
            },
            {
                key: 'placement',
                title: 'Размещение',
                floors: [
                    {
                        title: null,
                        consumerKeys: ['placement'],
                    },
                ]
            },
            {
                key: 'birthtype',
                title: 'Вид родов',
                floors: [
                    {
                        title: null,
                        consumerKeys: ['birthtype'],
                    },
                ]
            },
        
        ],
        
    }
};

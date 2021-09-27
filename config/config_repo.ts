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
    restrictors?: Restrictor[];
    priority?: PriorityFloor;
}

export interface TabConfig {
    key: string;
    title: string;
    floors: TabFloorSetting[];
}

export interface TabFloorSetting {
    title: string;
    entityType?: 'person' | 'placement' | 'other';
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
                key: 'doctors',
                title: null,
                busKey: 'bus_doctors_any',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'placement',
                title: null,
                busKey: 'bus_placement_any',
                priority: 'mid',
                restrictors: [],
            },
            {
                key: 'birthtype',
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
                        entityType: 'person',
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
                        entityType: 'placement',
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
                        entityType: 'other',
                        consumerKeys: ['birthtype'],
                    },
                ]
            },
        
        ],
        
    }
};

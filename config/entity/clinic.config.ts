import {Config} from "../config_repo";

export const ClinicConfig: Config = {
    providers: [
        {
            key: 'doctors',
            busKey: 'bus_doctors_any',
            entityKey: 'ent_doctor_slots',
            restrictors: [],
            title: 'Специалисты',
        },
        {
            key: 'placement',
            busKey: 'bus_placement_any',
            entityKey: 'ent_placement_slots',
            restrictors: [],
            title: 'Размещение',
        },
        {
            key: 'birthtype',
            busKey: 'bus_birthtype_any',
            entityKey: 'ent_birth_type_slots',
            restrictors: [],
            title: 'Виды родов',
        },
        {
            key: 'other',
            busKey: 'bus_other_any',
            entityKey: 'ent_birth_additional_slots',
            restrictors: [],
            title: 'Дополнительные услуги',
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
            entityKey: 'ent_birth_additional_slots',
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
                    selectMode: 'single',
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
                    selectMode: 'single',
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
                    required: false,
                },
            ],
        },

    ],
}

import {Config} from "../config_repo";

export const ConsultationConfig: Config = {
    providers: [
        {
            key: 'consultation_doctors',
            busKey: 'bus_consultation_doctors_any',
            entityKey: 'ent_consultation_doctor_slots',
            restrictors: [],
            title: 'Специалисты консультаций',
        },
        {
            key: 'birth_support',
            busKey: 'bus_birth_support_any',
            entityKey: 'ent_birth_support_consultation_slots',
            restrictors: [],
            title: 'Услуги ведения беременности',
        },
        {
            key: 'multibirth',
            busKey: 'bus_multibirth_any',
            entityKey: 'ent_multi_pregnant_slots',
            restrictors: [],
            title: 'Услуги ведения многоплодной беременности',
        },
        {
            key: 'online',
            busKey: 'bus_online_any',
            entityKey: 'ent_online_consultation_slots',
            restrictors: [],
            title: 'Онлайн услуги',
        },{
            key: 'eco',
            busKey: 'bus_eco_any',
            entityKey: 'ent_eco_consultation_slots',
            restrictors: [],
            title: 'Услуги ведения ЭКО беременности',
        },
    ],
    consumers: [
        {
            key: 'consultation_doctors',
            title: null,
            busKey: 'bus_consultation_doctors_any',
            entityKey: 'ent_consultation_doctor_slots',
            priority: 'mid',
            restrictors: [],
        },{
            key: 'birth_support',
            title: null,
            busKey: 'bus_birth_support_any',
            entityKey: 'ent_birth_support_consultation_slots',
            priority: 'mid',
            restrictors: [],
        },{
            key: 'multibirth',
            title: null,
            busKey: 'bus_multibirth_any',
            entityKey: 'ent_multi_pregnant_slots',
            priority: 'mid',
            restrictors: [],
        },{
            key: 'online',
            title: null,
            busKey: 'bus_online_any',
            entityKey: 'ent_online_consultation_slots',
            priority: 'mid',
            restrictors: [],
        },{
            key: 'eco',
            title: null,
            busKey: 'bus_eco_any',
            entityKey: 'ent_eco_consultation_slots',
            priority: 'mid',
            restrictors: [],
        },
    ],
    tabs: [
        {
            key: 'consultation_doctors',
            title: 'Врачи консультации',
            selectMode: 'single',
            floors: [
                {
                    key: 'consultation_doctors_1',
                    title: null,
                    entityType: 'person',
                    consumerKeys: ['consultation_doctors'],
                    selectMode: 'single',
                    required: true,
                },
            ],
        },{
            key: 'birth_support',
            title: 'Услуги',
            selectMode: 'single',
            floors: [
                {
                    key: 'birth_support_1',
                    title: null,
                    entityType: 'other',
                    consumerKeys: ['birth_support'],
                    selectMode: 'single',
                    required: false,
                },
            ],
        },{
            key: 'multibirth',
            title: 'Многоплодная беременность',
            selectMode: 'single',
            floors: [
                {
                    key: 'multibirth_1',
                    title: null,
                    entityType: 'other',
                    consumerKeys: ['multibirth'],
                    selectMode: 'single',
                    required: false,
                },
            ],
        },{
            key: 'online',
            title: 'Онлайн',
            selectMode: 'single',
            floors: [
                {
                    key: 'online_1',
                    title: null,
                    entityType: 'other',
                    consumerKeys: ['online'],
                    selectMode: 'single',
                    required: false,
                },
            ],
        },{
            key: 'eco',
            title: 'Онлайн',
            selectMode: 'single',
            floors: [
                {
                    key: 'eco_1',
                    title: null,
                    entityType: 'other',
                    consumerKeys: ['eco'],
                    selectMode: 'single',
                    required: false,
                },
            ],
        },
    ],
}

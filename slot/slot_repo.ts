import {Cached} from "../cache.engine/cache.model";
import { ContainerKeys } from "../container/container_repo";
import { EntityKeys } from "../entity/entity_repo.model";
import { SectionKeys } from "../search/config";

export interface Restrictor {
    key: string;
    value: number | string;
    mode?: 'positive' | 'negative';
}
export interface Slot extends Cached{
    name: string;
    title: string;
    db: string; // таблица слотов
    section: SectionKeys; // Ключ режима контрагента

    contragent_id_key: string; // название поля для хранения ссылки на КА
    contragent_entity_key: EntityKeys; // ключ сущности КА (section)
    container_name: ContainerKeys, // Имя контейнера если есть режим поакетного слота

    entity_key: EntityKeys; // ключ сущности
    entity_id_key: string; // название поля для хранения ссылки на сущность

    entity_fields: string[]; // поля для сущности которые показываем в информации о слоте(таблица, карточка)
    container_fields?: string[]; //поля контейнера (container_repo)
    override_fields?: string[]; // поля доступные для перекрытия
    required_fields?: string[]; //поля обязательные для слота
    required_fields_type?: { [key: string]: FieldType }; //поля обязательные для слота

    createAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по удалению сущности
    deleteAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по созданию либо сохранению сущности
    restrictsOfSlot?: Restrictor[]; // Ограничители по самой сущности слота в общих таблицах
}

export const SlotRepoKeys = [
    'slot_placement',
    'slot_doctors',
    'slot_consultation_doctors',
    'slot_birth_type',
    'slot_birth_additional',
    'slot_eco_consultation',
    'slot_birth_support_consultation',
    'slot_online_consultation',
    'slot_multi_pregnant',
] as const;

export type SlotKeys =  typeof SlotRepoKeys[number];
export type SlotRepo = {[key in SlotKeys]: Slot};

export type FieldType = 'number' | 'string' | 'flag';

export const slots: SlotRepo = {
    slot_placement: {
        name: 'slot_placement',
        title: 'Слоты для услуг размещения',
        db: 'service_slot', // БД связей
        container_name: "container_services",
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        section: 'clinic',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_clinic_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 2},
        ]
    },
    slot_doctors: {
        name: 'slot_doctors',
        title: 'Слоты для персонала',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        section: 'clinic',
        entity_key: 'ent_doctor', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_clinic_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 1},
            { key: 'section', value: 'clinic'},
        ]
    },
    slot_consultation_doctors: {
        name: 'slot_consultation_doctors',
        title: 'Слоты для персонала консультаций',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        section: 'consultation',
        entity_key: 'ent_doctor', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_consultation_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 1},
            { key: 'section', value: 'consultation'},
        ]
    },
    slot_birth_type: {
        name: 'slot_birth_type',
        title: 'Слоты для видов родов',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        section: 'clinic',
        entity_key: 'ent_birthtype', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_clinic_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 3},
        ]
    },
    slot_birth_additional: {
        name: 'slot_birth_additional',
        title: 'Слоты для дополнительных услуг роддома',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //типы
        section: 'clinic',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_clinic_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 4},
        ],
    },

    slot_eco_consultation: {
        name: 'slot_eco_consultation',
        title: 'Слоты для ЭКО услуг женских консультаций',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //типы
        section: 'consultation',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_consultation_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 5},
        ],
    },

    slot_birth_support_consultation: {
        name: 'slot_birth_support_consultation',
        title: 'Слоты для ведения беременности женских консультаций',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //типы
        section: 'consultation',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_consultation_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 8},
        ],
    },

    slot_online_consultation: {
        name: 'slot_online_consultation',
        title: 'Слоты для дополнительных услуг роддома',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //типы
        section: 'consultation',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_consultation_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 7},
        ],
    },
    slot_multi_pregnant: {
        name: 'slot_multi_pregnant',
        title: 'Слоты для дополнительных услуг роддома',
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        override_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //типы
        section: 'consultation',
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity_key: 'ent_consultation_contragents',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        restrictsOfSlot: [
            { key: 'slot_category_type', value: 6},
        ],
    }
};

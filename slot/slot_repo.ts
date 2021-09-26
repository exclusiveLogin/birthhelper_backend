import {Cached} from "../cache.engine/cache.model";
import { ContainerKeys } from "../container/container_repo";
import { EntityKeys } from "../entity/entity_repo.model";
import { SectionKeys } from "../search.engine/config";

export interface Restrictor {
    key: string;
    value: number | string;
    mode?: 'positive' | 'negative';
}
export interface Slot extends Cached{
    name: string;
    title: string;
    db: string; // таблица слотов 

    contragent_id_key: string; // название поля для хранения ссылки на КА
    contragent_entity: EntityKeys; // ключ сущности КА (section)
    container_name: ContainerKeys, // Имя контейнера если есть режим поакетного слота

    entity_key: EntityKeys; // ключ сущности
    entity_id_key: string; // название поля для хранения ссылки на сущность
    
    entity_fields: string[]; // поля для сущности которые показываем в информации о слоте(таблица, карточка)
    container_fields?: string[]; //поля контейнера (container_repo)
    overrided_fields?: string[]; // поля доступные для перекрытия
    required_fields?: string[]; //поля обязательные для слота
    required_fields_type?: { [key: string]: FieldType }; //поля обязательные для слота
    
    createAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по удалению сущности
    deleteAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по созданию либо сохранению сущности
    resrtictorsSlot?: Restrictor[]; // Ограничители по самой сущности слота в общих таблицах
    resrtictorsContragent?: Restrictor[];
    restrictorsEntity?: Restrictor[];
}

export const SlotRepoKeys = [
    'slot_placement',
    'slot_doctors',
    'slot_birth_type',
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
        overrided_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity: 'ent_clinics',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        resrtictorsSlot: [
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
        overrided_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        entity_key: 'ent_doctor', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity: 'ent_clinics',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        resrtictorsSlot: [
            { key: 'slot_category_type', value: 1},
        ]
    },
    slot_birth_type: {
        name: 'slot_birth_type',
        title: 'Слоты для видов родов', 
        db: 'service_slot', // БД связей
        container_name: null,
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        overrided_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'entity_type', 'slot_category_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'entity_type': 'string',
            'slot_category_type': 'string',
        }, //поля обязательные для слота
        entity_key: 'ent_birthtype', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        contragent_entity: 'ent_clinics',
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        resrtictorsSlot: [
            { key: 'slot_category_type', value: 3},
        ]
    }
};

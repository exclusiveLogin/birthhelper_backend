import {Cached} from "../cache.engine/cache.model";

export interface Slot extends Cached{
    name: string;
    title: string;
    db_entity: string; // БД сущностей
    db_container: string; // БД контейнеров,
    db_repo: string; //БД репозитория контейнеров
    db_links: string; // БД связей
    entity_fields: string[]; // поля для сущности которые показываем в информации о слоте(таблица, карточка)
    container_fields?: string[]; //поля контейнера (container_repo)
    overrided_fields?: string[]; // поля доступные для перекрытия
    required_fields?: string[]; //поля обязательные для слота
    required_fields_type?: { [key: string]: FieldType }; //поля обязательные для слота
    entity_key: string; // ключ сущности
    contragent_id_key: string; // название поля для хранения ссылки на КА
    entity_id_key: string; // название поля для хранения ссылки на сущность
}

export type FieldType = 'number' | 'string' | 'flag';

const slots: { [key: string]: Slot } = {
    slot_placement: {
        name: 'slot_placement',
        title: 'Слоты для услуг размещения',
        db_entity: 'services', // БД сущностей
        db_container: 'service_containers', // БД контейнеров,
        db_repo: 'services_containers_repo', //БД репозитория контейнеров
        db_links: 'service_slot', // БД связей
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        overrided_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'type', 'service_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'type': 'string',
            'service_type': 'string',
        }, //поля обязательные для слота
        entity_key: 'services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
    },
    slot_doctors: {
        name: 'slot_doctors',
        title: 'Слоты для персонала',
        db_entity: 'doctors', // БД сущностей
        db_container: null, // БД контейнеров,
        db_repo: null, //БД репозитория контейнеров
        db_links: 'service_slot', // БД связей
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        overrided_fields: ['price'], // поля доступные для перекрытия
        required_fields: ['price', 'service_id', 'contragent_id', 'type', 'service_type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'type': 'string',
            'service_type': 'string',
        }, //поля обязательные для слота
        entity_key: 'doctors', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
    }
};

module.exports = slots;

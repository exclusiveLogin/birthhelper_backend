import {Cached} from "../cache.engine/cache.model";
import { SectionKeys } from "../search/config";

export interface Container extends Cached{
    name: string;
    title: string;
    db_entity: string; // БД сущностей
    entity_fields?: string[]; // поля для
    override_fields?: string[]; // поля доступные для перекрытия
    container_id_key: string; // ключ связи контейнера и таблицы сущностей
    db_list: string; // БД списка существующих контейнеров данного типа
    db_links: string; // БД связей контейнеров
    entity_key: string; // ключ сущности
    createAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по удалению сущности
    deleteAffectionSectionKeys?: SectionKeys[]; // ключи секций для сброса по созданию либо сохранению сущности
}

export const ContainerRepoKeys = [
    'container_phones',
    'container_services',
    'container_specialities',
    'container_facilities',

] as const;

export type ContainerKeys =  typeof ContainerRepoKeys[number];
export type ContainerRepo = {[key in ContainerKeys]: Container};

export const containers: ContainerRepo = {
    container_phones: {
        name: 'container_phones',
        title: 'Контейнеры телефонов в системе',
        db_entity: 'phones', // БД сущностей
        entity_fields: ['phone', 'title', 'description', 'comment', 'section'], // поля для
        override_fields: ['title', 'description'], // поля доступные для перекрытия
        container_id_key: 'phone_id', // ключ связи контейнера и таблицы сущностей
        db_list: 'phones_containers_repo', // БД списка существующих контейнеров данного типа
        db_links: 'phone_containers', // БД связей контейнеров
        entity_key: 'ent_phones', // ключ сущности
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
    },
    container_services: {
        name: 'container_services',
        title: 'Контейнеры услуг в системе',
        db_entity: 'services', // БД сущностей
        entity_fields: ['title', 'description', 'trimester'], // поля для
        override_fields: ['title', 'description'], // поля доступные для перекрытия
        container_id_key: 'service_id', // ключ связи контейнера и таблицы сущностей
        db_list: 'services_containers_repo', // БД списка существующих контейнеров данного типа
        db_links: 'service_containers', // БД связей контейнеров
        entity_key: 'ent_services', // ключ сущности
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
    },
    container_specialities: {
        name: 'container_specialities',
        title: 'Контейнеры специализации клиник в системе',
        db_entity: 'clinic_specialities_type', // БД сущностей
        entity_fields: ['title'], // поля для
        container_id_key: 'speciality_id', // ключ связи контейнера и таблицы сущностей
        db_list: 'clinic_specialities_containers_repo', // БД списка существующих контейнеров данного типа
        db_links: 'clinic_specialities_containers', // БД связей контейнеров
        entity_key: 'ent_specialities_clinic', // ключ сущности
    },
    container_facilities: {
        name: 'container_facilities',
        title: 'Контейнеры удобств клиник в системе',
        db_entity: 'facilities_type', // БД сущностей
        entity_fields: ['title'], // поля для
        container_id_key: 'facility_id', // ключ связи контейнера и таблицы сущностей
        db_list: 'facilities_containers_repo', // БД списка существующих контейнеров данного типа
        db_links: 'facilities_containers', // БД связей контейнеров
        entity_key: 'ent_facilities', // ключ сущности
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
    },
};

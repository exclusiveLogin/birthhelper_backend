import {Cached} from "../cache.engine/cache.model";
import {SectionKeys} from "../search.engine/config";
import { SlotKeys } from "../slot/slot_repo";
export interface Entity extends Cached {
    db_name: string,
    filters: EntityFilter[],
    container?: string,
    slot?: SlotKeys,
    fields: EntityField[],
    links?: EntityLink[],
    fk?: EntityForeignKey,
    calculated?: EntityCalc[],
    searchKey?: SectionKeys,
    generateSummariesEnabled?: boolean,
    createAffectionSectionKeys?: SectionKeys[],
    deleteAffectionSectionKeys?: SectionKeys[],
}

export interface EntityFilter {
    name: string,
    title: string,
    type: string,
    readonly?: boolean,
    value?: any,
    db_name?: string,
    overrideKeys?: string[],
    formLink?: {
        formKey?: string,
        formFieldKey?: string,
    }
}

export const EntityRepoKeys = [
    'ent_services',
    'ent_services_placement',
    'ent_doctor',
    'ent_service_containers',
    'ent_clinics',
    'ent_districts',
    'ent_phone_containers',
    'ent_facilities_containers',
    'ent_specialities_clinic_containers',
    'ent_placement_slots',
    'ent_birth_type_slots',
    'ent_doctor_slots',
    'ent_phones',
    'ent_images',
    'ent_files',
    'ent_birthtype',
    'ent_birth_additional_slots',
    'ent_doctor_position',
    'ent_doctor_category',
    'ent_specialities_clinic',
    'ent_facilities',
    'ent_slot_category_type',
    'ent_order_status_type',

] as const;

export type EntityKeys = typeof EntityRepoKeys[number]

export type EntityRepo = { [key in EntityKeys]: Entity }

export type FieldType = 'string' | 'flag' | 'id' | 'dict' | 'number' | 'text' | 'img';

export interface EntityField {
    key: string,
    type: FieldType,
    title?: string,
    dctKey?: string,
    useDict?: boolean,
    canBeNull?: boolean,
    initData?: any,
    required?: boolean,
    readonly?: boolean,
    showOnTable?: boolean,
    hide?: boolean,
    titleDictKey?: string,
    loadEntity?: boolean,
}

export interface EntityLink{
    type: string,
    entKey: string,
    title?: string,
    multiselect?: boolean,
    entType?: string,
    proxyTo?: string,
    conditionField?: string,
    conditionKey?: string,
    conditionValue?: string,
    dummyTitle?: string,
    image?: {
        urlType: string,
        urlKey: string,
    },
    imageLoader?: true,
    filters?: EntityFilter[],
}

export interface EntityCalc{
    key: string,
    type: string,
    id_key: string,
    db_name: string,
}

export interface EntityForeignKey{
    db: string,
    target: string[],
    key: string,
    restrictors?: [{
        key: string,
        value: string,
    }]
}

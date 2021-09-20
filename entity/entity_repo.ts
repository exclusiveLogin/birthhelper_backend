import {EntityRepo} from '../entity/entity_repo.model';

export const entityRepo: EntityRepo = {
    ent_services: {
        db_name: 'services',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'title',
                title: 'Название услуги',
                type: 'string',
            },
        ],
        fields:[ 
            { key: 'id', title: 'ID услуги', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название услуги', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание услуги', type: 'text', showOnTable: true }, 
            { key: 'article_id', type: 'id', hide: true, showOnTable: false }, 
            { key: 'image_id', title: 'Прикрепленное изображение', type: 'img', showOnTable: false },
            { 
                key: 'trimester', 
                type: 'id', 
                title: 'Триместер услуги', 
                useDict: true,
                dctKey: 'dict_trimester_service',
                canBeNull: true,
                showOnTable: true
            },
            {
                key: 'slot_category_type',
                type: 'id',
                title: 'Тип услуги',
                useDict: true,
                dctKey: 'dict_slot_category_type',
                canBeNull: false,
                required: true,
                showOnTable: true,
            },
            { key: 'adv', title: 'Рекламная услуга', type: 'flag', showOnTable: false  },
        ]
    },

    ent_doctor: {
        db_name: 'doctors',
        filters: [
            {
                name: 'def',
                title: 'Врачи по умолчанию',
                override: true,
                type: 'flag',
            },
        ],
        container: null,
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        fields: [
            { key: 'id', title: 'ID специалиста', type: 'id', readonly: true, showOnTable: false },
            { key: 'image_id', title: 'Фото', type: 'img', showOnTable: false },
            { key: 'full_name', type: 'string', title: 'Имя', required: true, showOnTable: true },
            { key: 'short_name', type: 'string', title: 'Фамилия', required: true, showOnTable: false },
            { key: 'patronymic', type: 'string', title: 'Отчество', required: false, showOnTable: false },
            { key: 'experience', title: 'Стаж работы', type: 'string', showOnTable: false },
            { key: 'count', title: 'Количество родов', type: 'string', showOnTable: false },
            { key: 'description_education', title: 'Образование', type: 'text', showOnTable: false },
            { key: 'description_experience', title: 'Профессиональные навыки', type: 'text', showOnTable: false },
            { key: 'category', title: 'Категория врача', type: 'id', useDict: true, dctKey: 'dict_doctor_category_type', showOnTable: true },
            { key: 'position', title: 'Должность врача', type: 'id', useDict: true, dctKey: 'dict_doctor_position_type', showOnTable: true },
            { key: 'clinic_id', type: 'id', title: 'Клиника', showOnTable: true, useDict: true, dctKey: 'dict_clinics' },
            { key: 'def', title: 'Врач по умолчанию', type: 'flag', showOnTable: true  },
        ],
    },

    ent_service_containers: { 
        db_name: 'services_containers_repo',
        filters: [],
        container: 'container_services',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        fields: [
            { key: 'id', title: 'ID контейнера', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание', type: 'text', required: true, showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'text', showOnTable: true, readonly: true },
        ],
        links: [
            { type: 'repo', title: 'Таблица услуг системы', entKey: 'services', multiselect: true, dummyTitle: 'Услуги в контейнере'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'service_containers' },
        ]
    },

    ent_clinics: {
        db_name: 'clinics',
        searchKey: 'clinic',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'id',
                title: 'По ID',
                type: 'id',
                db_name: 'dict_clinics'

            },
            {
                name: 'title',
                title: 'По названию',
                type: 'string',
            },
            {
                name: 'active',
                title: 'По Активности',
                type: 'flag',
            },
        ],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true, showOnTable: true }, 
            { key: 'title', type: 'string', title: 'Название клиники', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание клиники', type: 'text', showOnTable: false },
            { key: 'image_id', title: 'Главное фото', type: 'img', showOnTable: false, loadEntity: true },
            { key: 'active', title: 'Активная', type: 'flag', showOnTable: false  },
            { key: 'status_iho', title: 'Статус ВОЗ', type: 'flag', showOnTable: false  },
            { key: 'has_consultation', title: 'Имеет женскую консульстацию', type: 'flag', showOnTable: false  },
            { key: 'has_reanimation', title: 'Имеет реанимацию', type: 'flag', showOnTable: false  },
            { key: 'has_oms', title: 'Имеет поддержку ОМС', type: 'flag', required: false, showOnTable: false  },
            { key: 'has_dms', title: 'Имеет поддержку ДМС', type: 'flag', required: false, showOnTable: false  },
            { key: 'stat_male', type: 'number', title: 'Рождено мальчиков', required: false, showOnTable: false }, 
            { key: 'stat_female', type: 'number', title: 'Рождено девочек', required: false, showOnTable: false }, 
            { key: 'mom_with_baby', type: 'flag', title: 'Совместное пребывание матери и ребенка', required: false, showOnTable: false },
            { key: 'free_meets', type: 'flag', title: 'Свободное посещение', required: false, showOnTable: false },
            { 
                key: 'address_id', 
                title: 'Адрес клиники', 
                dctKey: 'dict_address_id', 
                type: 'id', 
                useDict: true, 
                canBeNull: false,
                required: true,
                showOnTable: true,
                loadEntity: true,
            },
            { 
                key: 'facilities_type', 
                title: 'Пакет удобств клиники', 
                dctKey: 'dict_facilities_containers_repo', 
                type: 'id', 
                useDict: true, 
                canBeNull: false,
                required: true,
                showOnTable: true,
            },
            {
                key: 'specialities_type',
                title: 'Пакет специализации клиники',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_clinic_specialities_containers_repo',
            }
        ]
    },

    ent_districts: { 
        db_name: 'districts',
        filters: [],
        fields: [
            
        ]
    },

    ent_phone_containers: { 
        db_name: 'phones_containers_repo',
        filters: [],
        container: 'container_phones',
        fields: [
            { key: 'id', title: 'ID контейнера', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание', type: 'text', required: true, showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'text', showOnTable: true, readonly: true },
        ],
        links: [
            { type: 'repo', title: 'Таблица телефонов системы', entKey: 'phones', multiselect: true, dummyTitle: 'Таблица выбранных телефонов контейнера'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'phone_containers' },
        ]
    },

    ent_facilities_containers: { 
        db_name: 'facilities_containers_repo',
        filters: [],
        container: 'container_facilities',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        fields: [
            { key: 'id', title: 'ID контейнера', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание', type: 'text', required: true, showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'text', showOnTable: true, readonly: true },
        ],
        links: [
            { type: 'repo', title: 'Таблица удобств клиник системы', entKey: 'facilities', multiselect: true, dummyTitle: 'Таблица выбранных удобств контейнера'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'facilities_containers' },
        ]
    },

    ent_specialities_clinic_containers: { 
        db_name: 'clinic_specialities_containers_repo',
        filters: [],
        container: 'container_specialities',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        fields: [
            { key: 'id', title: 'ID контейнера', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание', type: 'text', required: true, showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'text', showOnTable: true, readonly: true },
        ],
        links: [
            { type: 'repo', title: 'Таблица специализаций для клиники', entKey: 'specialities_clinic', multiselect: true, dummyTitle: 'Таблица выбранных специализаций контейнера'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'clinic_specialities_containers' },
        ]
    },

    ent_placement_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'slot_category_type',
                title: 'Категория',
                readonly: true,
                type: 'id',
                value: 2,
                db_name: 'dict_slot_category_type'
            }
        ],
        container: null,
        slot: 'slot_placement',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'string', title: 'id клиники', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'entity_type',
                title: 'Тип услуги',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_entity_type'
            },
            {
                key: 'slot_category_type',
                title: 'Вид услуги в конструкторе',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_slot_category_type',
                readonly: true,
                initData: 2,
            },
            {
                key: 'facilities_type',
                title: 'Пакет удобств в конструкторе',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_facilities_containers_repo'
            }
        ],
        links: [
            {
                type: 'repo',
                title: 'Таблица услуг',
                entKey: 'services',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица пакетов услуг',
                entKey: 'service_containers',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'container'
            },
            {
                type: 'repo',
                title: 'Таблица клиник системы',
                entKey: 'clinics',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_birth_type_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'slot_category_type',
                title: 'Категория',
                readonly: true,
                type: 'id',
                value: 3,
                db_name: 'dict_slot_category_type'
            }
        ],
        container: null,
        slot: 'slot_birth_type',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'string', title: 'id клиники', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'entity_type',
                title: 'Тип услуги',
                required: true,
                type: 'id',
                initData: 1,
                readonly: true,
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_entity_type'
            },
            {
                key: 'slot_category_type',
                title: 'Вид услуги в конструкторе',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_slot_category_type',
                readonly: true,
                initData: 3,
            },
        ],
        links: [
            {
                type: 'repo',
                title: 'Таблица видов родов',
                entKey: 'birthtype',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица клиник системы',
                entKey: 'clinics',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_doctor_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'slot_category_type',
                title: 'Категория',
                readonly: true,
                type: 'id',
                value: 1,
                db_name: 'dict_slot_category_type'
            }
        ],
        container: null,
        slot: 'slot_doctors',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'string', title: 'id клиники', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'entity_type',
                title: 'Тип услуги',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_entity_type',
                readonly: true,
                initData: 1,
            },
            {
                key: 'slot_category_type',
                title: 'Вид услуги в конструкторе',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_slot_category_type',
                readonly: true,
                initData: 1,
            },
        ],
        links: [
            {
                type: 'repo',
                title: 'Таблица персонала',
                entKey: 'doctor',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                filters: [
                    {
                        name: 'clinic_id',
                        title: 'ID клиники',
                        db_name: 'clinics',
                        type: 'string',
                        readonly: true,
                        formLink: {
                            formKey: 'editor',
                            formFieldKey: 'contragent_id'
                        }
                    },
                ],
            },
            {
                type: 'repo',
                title: 'Таблица клиник системы',
                entKey: 'clinics',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_phones: { 
        db_name: 'phones',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID телефона', type: 'id', readonly: true, showOnTable: true }, 
            { key: 'phone', type: 'string', title: 'Телефон', required: true, showOnTable: true }, 
            { key: 'title', type: 'string', title: 'Название телефона', required: false, showOnTable: true }, 
            { key: 'description', title: 'Описание телефона', type: 'text', showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
        ]
    },

    ent_images: {
        db_name: 'images',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID картинки', type: 'id', readonly: true, showOnTable: true },
            { key: 'file_id', type: 'img', title: 'ID Файла', readonly: true, showOnTable: true, loadEntity: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'string', readonly: false, showOnTable: true },
        ],
        links: [
            {
                type: 'repo',
                title: 'Таблица файлов системы',
                entKey: 'files',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'file_id',
                image: {
                    urlType: 'simple',
                    urlKey: 'filename'
                },
                imageLoader: true,
            },
        ],
    },

    ent_files: {
        db_name: 'files',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID файла', type: 'id', readonly: true, showOnTable: true },
            { key: 'filename', type: 'string', title: 'Название', readonly: true, showOnTable: true },
            { key: 'type', title: 'Тип файла MIME', type: 'string', readonly: true, showOnTable: true },
            { key: 'folder', title: 'Имя файлсервера', type: 'string', readonly: true, showOnTable: true },
        ]
    },
    // Dicts
    ent_birthtype: {
        db_name: 'birthtype',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_doctor_position: {
        db_name: 'doctor_position_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_doctor_category: {
        db_name: 'doctor_category_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_specialities_clinic: {
        db_name: 'clinic_specialities_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_facilities: {
        db_name: 'facilities_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },
    
    ent_slot_category_type: {
        db_name: 'slot_category_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

};

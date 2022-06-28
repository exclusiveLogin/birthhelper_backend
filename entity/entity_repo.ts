import {EntityRepo} from '../entity/entity_repo.model';

export const entityRepo: EntityRepo = {
    ent_users: {
        db_name: 'users',
        filters: [
            {
                name: 'login',
                title: 'Логин',
                type: 'string',
            },
            {
                name: 'first_name',
                title: 'Имя',
                type: 'string',
            },
        ],
        fields:[
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', type: 'flag', title: 'Активный', required: true, showOnTable: true },
            { key: 'activation', type: 'string', title: 'Код активации', required: false, showOnTable: false, readonly: true },
            { key: 'login', type: 'string', title: 'Логин', required: true, showOnTable: true },
            { key: 'first_name', type: 'string', title: 'Имя', required: false, showOnTable: true },
            { key: 'last_name', type: 'string', title: 'Фамилия', required: false, showOnTable: true },
            { key: 'patronymic', type: 'string', title: 'Отчество', required: false, showOnTable: false },
            { key: 'photo_id', title: 'Аватар', type: 'img', showOnTable: false, loadEntity: true},
            { key: 'multi_pregnant', title: 'Многоплодная беременность', type: 'flag', showOnTable: false},
            { key: 'client_birthday_datetime', title: 'День рождения', type: 'date', showOnTable: false},
            { key: 'conception_datetime', title: 'День зачатия', type: 'date', showOnTable: false},
            { key: 'has_problems', title: 'Осложнения', type: 'flag', showOnTable: false},
            { key: 'phone', type: 'string', title: 'Телефон', required: false, showOnTable: false },
            { key: 'email', type: 'string', title: 'Почта', required: false, showOnTable: false },
            { key: 'skype', type: 'string', title: 'Skype', required: false, showOnTable: false },
            { key: 'ch_phone', type: 'flag', title: 'Телефон', required: false, showOnTable: false },
            { key: 'ch_email', type: 'flag', title: 'Почта', required: false, showOnTable: false },
            { key: 'ch_skype', type: 'flag', title: 'Skype', required: false, showOnTable: false },
            { key: 'ch_viber', type: 'flag', title: 'Viber', required: false, showOnTable: false },
            { key: 'ch_whatsapp', type: 'flag', title: 'WhatsApp', required: false, showOnTable: false },
            { key: 'ch_telegram', type: 'flag', title: 'Telegram', required: false, showOnTable: false },
            { key: 'height', type: 'string', title: 'Рост', required: false, showOnTable: false },
            { key: 'weight', type: 'string', title: 'Вес', required: false, showOnTable: false },
            { key: 'clothes_size', type: 'string', title: 'Размер одежды', required: false, showOnTable: false },
            { key: 'shoes_size', type: 'string', title: 'Размер обуви', required: false, showOnTable: false },
            { key: 'datetime_create', type: 'string', title: 'Времая создания', required: false, showOnTable: false },
            { key: 'datetime_update', type: 'string', title: 'Время обновления', required: false, showOnTable: false },
            {
                key: 'status_type',
                type: 'id',
                title: 'Статус пользователя',
                useDict: true,
                dctKey: 'dict_user_status_type',
                canBeNull: true,
                showOnTable: true
            },
            {
                key: 'role',
                type: 'id',
                title: 'Роль пользователя',
                useDict: true,
                dctKey: 'dict_user_role_type',
                canBeNull: true,
                showOnTable: true
            },
        ],
        permissions: {
            create: 7,
            delete: 7,
            edit: 3,
            read: 3,
        }
    },

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
            { key: 'description_ext1', title: 'Описание услуги расширенное 1', type: 'text', showOnTable: false },
            { key: 'description_ext2', title: 'Описание услуги расширенное 2', type: 'text', showOnTable: false },
            { key: 'article_id', type: 'id', hide: true, showOnTable: false },
            { key: 'image_id', title: 'Прикрепленное изображение', type: 'img', showOnTable: false, loadEntity: true},
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

    ent_services_placement: {
        db_name: 'services',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'slot_category_type',
                title: 'Тип услуги',
                type: 'id',
                dictKey: 'dict_slot_category_type',
                readonly: true,
                value: '2',

            },
        ],
        fields:[
            { key: 'id', title: 'ID услуги', type: 'id', readonly: true, showOnTable: false },
            { key: 'title', type: 'string', title: 'Название услуги', required: true, showOnTable: true },
            { key: 'description', title: 'Описание услуги', type: 'text', showOnTable: false },
            { key: 'description_ext1', title: 'Описание услуги расширенное 1', type: 'text', showOnTable: false },
            { key: 'description_ext2', title: 'Описание услуги расширенное 2', type: 'text', showOnTable: false },
            { key: 'image_id', title: 'Прикрепленное изображение', type: 'img', showOnTable: false, loadEntity: true},
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
        ]
    },

    ent_doctor: {
        db_name: 'doctors',
        filters: [
            {
                name: 'def',
                title: 'Врачи по умолчанию',
                overrideKeys:['clinic_id'],
                type: 'flag',
            },
            {
                name: 'position',
                title: 'Специализация врача',
                type: 'id',
                dictKey: 'dict_doctor_position_type',
            },
        ],
        container: null,
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        fields: [
            { key: 'id', title: 'ID специалиста', type: 'id', readonly: true, showOnTable: false },
            { key: 'image_id', title: 'Фото', type: 'img', showOnTable: false, loadEntity: true },
            { key: 'full_name', type: 'string', title: 'Имя', required: true, showOnTable: true },
            { key: 'short_name', type: 'string', title: 'Фамилия', required: true, showOnTable: false },
            { key: 'patronymic', type: 'string', title: 'Отчество', required: false, showOnTable: false },
            { key: 'experience', title: 'Стаж работы', type: 'string', showOnTable: false },
            { key: 'count', title: 'Количество родов', type: 'string', showOnTable: false },
            { key: 'description_education', title: 'Образование', type: 'text', showOnTable: false },
            { key: 'description_experience', title: 'Описание опыта', type: 'text', showOnTable: false },
            { key: 'description_pro', title: 'Профессиональные навыки', type: 'text', showOnTable: false },
            { key: 'description_services', title: 'Описание услуг', type: 'text', showOnTable: false },
            { key: 'category', title: 'Категория врача', type: 'id', useDict: true, dctKey: 'dict_doctor_category_type', showOnTable: true, loadEntity: true },
            { key: 'position', title: 'Специализация врача', type: 'id', useDict: true, dctKey: 'dict_doctor_position_type', showOnTable: true, loadEntity: true },
            { key: 'clinic_id', type: 'id', title: 'Контрагент', showOnTable: true, useDict: true, dctKey: 'dict_contragents' },
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
            { type: 'repo', title: 'Таблица услуг системы', entKey: 'ent_services', multiselect: true, dummyTitle: 'Услуги в контейнере'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'service_containers' },
        ]
    },

    ent_contragents: {
        db_name: 'contragents',
        createAffectionSectionKeys: ['clinic', 'consultation'],
        deleteAffectionSectionKeys: ['clinic', 'consultation'],
        filters: [
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
            {
                name: 'section_clinic',
                title: 'Имеет роддом',
                type: 'flag',
            },
            {
                name: 'section_consultation',
                title: 'Имеет консультацию',
                type: 'flag',
            },
        ],
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', showOnTable: false },
            { key: 'image_id', title: 'Главное фото', type: 'img', showOnTable: false, loadEntity: true },
            { key: 'active', title: 'Активный', type: 'flag', showOnTable: false  },
            { key: 'licence', type: 'string', title: 'Лицензия', required: false },
            {
                key: 'phone_container_id',
                type: 'id',
                dctKey: 'dict_phone_container',
                title: 'Телефоны контрагента',
                required: true,
                readonly: true,
            },
            { key: 'map', title: 'Карта', type: 'map', virtual: true, mapMeta: {
                    geocoder: {
                        addressFieldKey: 'address_str',
                        cityFieldKey: 'city',
                        countryFieldKey: 'country',
                        addressRewriteOnlyEmpty: true,
                        enabled: true,
                        latFieldKey: 'position_lat',
                        lonFieldKey: 'position_lon',
                        provider: 'dadata'
                    },
                }
            },
            { key: 'address_str', type: 'string', title: 'Адрес', required: true, showOnTable: true },
            { key: 'city', type: 'string', title: 'Город', required: true, showOnTable: true },
            { key: 'country', type: 'string', title: 'Страна', required: true, showOnTable: true },
            { key: 'position_lat', type: 'number', title: 'Широта', required: true, showOnTable: true },
            { key: 'position_lon', type: 'number', title: 'Долгота', required: true, showOnTable: true },
            { key: 'section_clinic', title: 'Имеет роддом', type: 'flag', showOnTable: true  },
            { key: 'section_consultation', title: 'Имеет женскую консультацию', type: 'flag', showOnTable: true  },
        ],
        links: [
            {
                type: 'repo',
                title: 'Таблица телефонов',
                entKey: 'ent_phone_containers',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'phone_container_id',
                // conditionField: 'entity_type',
                // conditionKey: 'name',
                // conditionValue: 'entity'
            },
        ],
    },

    ent_clinic_contragents: {
        db_name: 'clinics',
        searchKey: 'clinic',
        isContragent: true,
        generateSummariesEnabled: true,
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [
            {
                name: 'id',
                title: 'По ID',
                type: 'id',
                dictKey: 'dict_clinics'

            },
        ],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true, showOnTable: true },
            { key: 'status_iho', title: 'Статус ВОЗ', type: 'flag', showOnTable: false  },
            { key: 'has_reanimation', title: 'Имеет реанимацию', type: 'flag', showOnTable: false  },
            { key: 'has_oms', title: 'Имеет поддержку ОМС', type: 'flag', required: false, showOnTable: false  },
            { key: 'has_dms', title: 'Имеет поддержку ДМС', type: 'flag', required: false, showOnTable: false  },
            { key: 'stat_male', type: 'number', title: 'Рождено мальчиков', required: false, showOnTable: false },
            { key: 'stat_female', type: 'number', title: 'Рождено девочек', required: false, showOnTable: false },
            { key: 'mom_with_baby', type: 'flag', title: 'Совместное пребывание матери и ребенка', required: false, showOnTable: false },
            { key: 'free_meets', type: 'flag', title: 'Свободное посещение', required: false, showOnTable: false },
            {
                key: 'contragent',
                title: 'Линк на ведущий родительский контрагент',
                dctKey: 'dict_contragent_clinics',
                type: 'id',
                useDict: true,
                canBeNull: false,
                required: true,
                showOnTable: true,
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

    ent_consultation_contragents: {
        db_name: 'consultation',
        searchKey: 'consultation',
        isContragent: true,
        generateSummariesEnabled: true,
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        filters: [],
        fields: [
            { key: 'id', title: 'ID консультации', type: 'id', readonly: true, showOnTable: true },
            { key: 'avo', title: 'АВО статус', type: 'flag', showOnTable: false  },
            { key: 'anemy', title: 'Различные анемии', type: 'flag', showOnTable: false  },
            { key: 'anomaly_evolution', title: 'Аномалии развития', type: 'flag', required: false, showOnTable: false  },
            { key: 'gestos', title: 'Гестоз', type: 'flag', required: false, showOnTable: false  },
            { key: 'hypoxy', type: 'flag', title: 'Гипоксия плода', required: false, showOnTable: false },
            { key: 'mioms', type: 'flag', title: 'Миома матки', required: false, showOnTable: false },
            { key: 'onko', type: 'flag', title: 'Онкопатология', required: false, showOnTable: false },
            { key: 'home_visit', type: 'flag', title: 'Посещение на дому', required: false, showOnTable: false },
            {
                key: 'contragent',
                title: 'Линк на ведущий родительский контрагент',
                dctKey: 'dict_contragent_consultations',
                type: 'id',
                useDict: true,
                canBeNull: false,
                required: true,
                showOnTable: true,
            },
        ]
    },

    ent_orders: {
        db_name: 'orders',
        filters: [
            {
                name: 'user_id',
                title: 'По ID пользователя',
                type: 'number',
            },
            {
                name: 'status',
                title: 'По статусу',
                type: 'id',
                dictKey: 'dict_order_status_type',
            },
        ],
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true },
            { key: 'user_id', type: 'id', title: 'ID пользователя', required: true },
            { key: 'session_id', type: 'id', title: 'ID сессии', required: true },
            { key: 'slot_entity_key', type: 'string', title: 'Имя слота', required: true },
            { key: 'slot_entity_id', type: 'id', title: 'ID слота', required: true },
            { key: 'contragent_entity_key', type: 'string', title: 'Имя типа контрагента', required: true },
            { key: 'contragent_entity_id', type: 'id', title: 'ID контрагента', required: true },
            { key: 'section_key', type: 'string', title: 'Ключ раздела', required: true },
            { key: 'tab_key', type: 'string', title: 'Ключ вкладки', required: true },
            { key: 'floor_key', type: 'string', title: 'Ключ этажа', required: true },
            { key: 'refferer', type: 'id', title: 'Изменятель', required: true },
            { key: 'group_token', type: 'string', title: 'Ключ группы заказа', required: true },
            { key: 'status', type: 'string', title: 'Статус', required: true },
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
            { key: 'id', title: 'ID контейнера', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', type: 'string', title: 'Название', required: true, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', required: true, showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'string', showOnTable: true, readonly: true },
        ],
        links: [
            { type: 'repo', title: 'Таблица телефонов системы', entKey: 'ent_phones', multiselect: true, dummyTitle: 'Таблица выбранных телефонов контейнера'},
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
            { type: 'repo', title: 'Таблица удобств клиник системы', entKey: 'ent_facilities', multiselect: true, dummyTitle: 'Таблица выбранных удобств контейнера'},
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
            { type: 'repo', title: 'Таблица специализаций для клиники', entKey: 'ent_specialities_clinic', multiselect: true, dummyTitle: 'Таблица выбранных специализаций контейнера'},
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'clinic_specialities_containers' },
        ]
    },

    ent_placement_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        slot: 'slot_placement',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'image_id', title: 'Прикрепленное изображение', type: 'img', showOnTable: false, loadEntity: true},
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id клиники', required: true, showOnTable: true, readonly: true },
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
                entKey: 'ent_services',
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
                entKey: 'ent_service_containers',
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
                entKey: 'ent_clinic_contragents',
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
        filters: [],
        container: null,
        slot: 'slot_birth_type',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id клиники', required: true, showOnTable: true, readonly: true },
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
                entKey: 'ent_birthtype',
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
                entKey: 'ent_clinic_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_birth_additional_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        slot: 'slot_birth_additional',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id клиники', required: true, showOnTable: true, readonly: true },
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
                initData: 4,
            },
        ],
        links: [
            {
                filters: [
                    {
                        name: 'slot_category_type',
                        title: 'Тип услуги',
                        type: 'id',
                        dictKey: 'dict_slot_category_type',
                        readonly: true,
                        value: 4,
                    }
                ],
                type: 'repo',
                title: 'Таблица дополнительных услуг',
                entKey: 'ent_services',
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
                entKey: 'ent_clinic_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_doctor_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic', 'consultation'],
        createAffectionSectionKeys: ['clinic', 'consultation'],
        filters: [
            {
                title: 'Тип контрагента',
                name: 'section',
                type: 'id',
                dictKey: 'dict_section_type',
                value: 'clinic',
                valueKey: 'slug',
                readonly: true,
            },
        ],
        container: null,
        slot: 'slot_doctors',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'id', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id контрагента', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'section',
                type: 'string',
                title: 'Тип контрагента',
                required: true,
                showOnTable: true,
                dctKey: 'dict_section_type',
                useDict: true,
                valueKey: 'slug',
                readonly: true,
                initData: 'clinic'
            },
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
                entKey: 'ent_doctor',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                filters: [
                    {
                        name: 'clinic_id',
                        title: 'ID клиники',
                        dictKey: 'dict_clinics',
                        type: 'id',
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
                entKey: 'ent_clinic_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id',
                proxyKey: 'contragent',
            },
        ],
    },

    ent_consultation_doctor_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['clinic', 'consultation'],
        createAffectionSectionKeys: ['clinic', 'consultation'],
        filters: [
            {
                title: 'Тип контрагента',
                name: 'section',
                type: 'id',
                dictKey: 'dict_section_type',
                value: 'consultation',
                valueKey: 'slug',
                readonly: true,
            },
        ],
        container: null,
        slot: 'slot_consultation_doctors',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'id', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id контрагента', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'section',
                type: 'string',
                title: 'Тип контрагента',
                required: true,
                showOnTable: true,
                dctKey: 'dict_section_type',
                useDict: true,
                valueKey: 'slug',
                readonly: true,
                initData: 'consultation'
            },
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
                entKey: 'ent_doctor',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                filters: [
                    {
                        name: 'clinic_id',
                        title: 'ID женской консультации',
                        dictKey: 'dict_consultations',
                        type: 'id',
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
                title: 'Таблица женских консультаций',
                entKey: 'ent_consultation_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id',
                proxyKey: 'contragent',
            },
        ],
    },

    ent_birth_support_consultation_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        filters: [],
        container: null,
        slot: 'slot_birth_support_consultation',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id женской консультации', required: true, showOnTable: true, readonly: true },
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
                initData: 8,
            },
        ],
        links: [
            {
                filters: [
                    {
                        name: 'slot_category_type',
                        title: 'Тип услуги',
                        type: 'id',
                        dictKey: 'dict_slot_category_type',
                        readonly: true,
                        value: 8,
                    }
                ],
                type: 'repo',
                title: 'Таблица услуг ведения беременности',
                entKey: 'ent_services',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица женских консультаций системы',
                entKey: 'ent_consultation_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_multi_pregnant_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        filters: [],
        container: null,
        slot: 'slot_multi_pregnant',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id женской консультации', required: true, showOnTable: true, readonly: true },
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
                initData: 6,
            },
        ],
        links: [
            {
                filters: [
                    {
                        name: 'slot_category_type',
                        title: 'Тип услуги',
                        type: 'id',
                        dictKey: 'dict_slot_category_type',
                        readonly: true,
                        value: 6,
                    }
                ],
                type: 'repo',
                title: 'Таблица дополнительных услуг',
                entKey: 'ent_services',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица женских консультаций системы',
                entKey: 'ent_consultation_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_online_consultation_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        filters: [],
        container: null,
        slot: 'slot_online_consultation',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id женской консультации', required: true, showOnTable: true, readonly: true },
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
                initData: 7,
            },
        ],
        links: [
            {
                filters: [
                    {
                        name: 'slot_category_type',
                        title: 'Тип услуги',
                        type: 'id',
                        dictKey: 'dict_slot_category_type',
                        readonly: true,
                        value: 7,
                    }
                ],
                type: 'repo',
                title: 'Таблица дополнительных услуг',
                entKey: 'ent_services',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица женских консультаций системы',
                entKey: 'ent_consultation_contragents',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'contragent_id'
            },
        ],
    },

    ent_eco_consultation_slots: {
        db_name: 'service_slot',
        deleteAffectionSectionKeys: ['consultation'],
        createAffectionSectionKeys: ['consultation'],
        filters: [],
        container: null,
        slot: 'slot_eco_consultation',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'active', title: 'Активный слот', type: 'flag', showOnTable: false  },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги или пакета', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'id', title: 'id женской консультации', required: true, showOnTable: true, readonly: true },
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
                initData: 5,
            },
        ],
        links: [
            {
                filters: [
                    {
                        name: 'slot_category_type',
                        title: 'Тип услуги',
                        type: 'id',
                        dictKey: 'dict_slot_category_type',
                        readonly: true,
                        value: 5,
                    }
                ],
                type: 'repo',
                title: 'Таблица дополнительных услуг',
                entKey: 'ent_services',
                multiselect: false,
                entType: 'entity',
                proxyTo: 'service_id',
                conditionField: 'entity_type',
                conditionKey: 'name',
                conditionValue: 'entity'
            },
            {
                type: 'repo',
                title: 'Таблица женских консультаций системы',
                entKey: 'ent_consultation_contragents',
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
            { key: 'section', title: 'Роль', type: 'string', showOnTable: true, dctKey: 'dict_section_type', useDict: true, valueKey: 'slug', required: true, canBeNull: false},
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
                entKey: 'ent_files',
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
            { key: 'aws', type: 'string', title: 'Путь файла в облаке', readonly: true, showOnTable: true },
            { key: 'type', title: 'Тип файла MIME', type: 'string', readonly: true, showOnTable: true },
            { key: 'folder', title: 'Имя файлсервера', type: 'string', readonly: true, showOnTable: true },
        ]
    },

    ent_lk_permissions: {
        db_name: 'lk_permissions',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID файла', type: 'id', readonly: true, showOnTable: true },
            { key: 'user_id', type: 'id', title: 'ID пользователя', readonly: true, showOnTable: true },
            { key: 'contragent_entity_key', type: 'string', title: 'Ключ сущности контрагента', readonly: true, showOnTable: true },
            { key: 'contragent_entity_id', type: 'id', title: 'ID контрагента', readonly: true, showOnTable: true },
            {
                key: 'permission_id',
                type: 'id',
                useDict: true,
                dctKey: 'dict_lk_permission_type',
                title: 'ID разрешения',
                readonly: true,
                showOnTable: true,
                loadEntity: true,
            },
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
            { key: 'image_id', title: 'Фото', type: 'img', showOnTable: false, loadEntity: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
            { key: 'description_ext1', title: 'Описание расширенное 1', type: 'text', showOnTable: false },
            { key: 'description_ext2', title: 'Описание расширенное 2', type: 'text', showOnTable: false },
            { key: 'advantage', title: 'Преимущества', type: 'text', showOnTable: false },
            { key: 'lack', title: 'Недостатки', type: 'text', showOnTable: false },
            { key: 'motivator', title: 'Мотиватор', type: 'string' },
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

    ent_order_status_type: {
        db_name: 'order_status_type',
        deleteAffectionSectionKeys: ['clinic'],
        createAffectionSectionKeys: ['clinic'],
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'slug', title: 'Ключ', type: 'string', readonly: false, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_user_status_type: {
        db_name: 'user_status_type',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'slug', title: 'Ключ', type: 'string', readonly: false, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

    ent_lk_permission_type: {
        db_name: 'lk_permission_type',
        filters: [],
        container: null,
        fields: [
            { key: 'id', title: 'ID', type: 'id', readonly: true, showOnTable: true },
            { key: 'slug', title: 'Ключ', type: 'string', readonly: false, showOnTable: true },
            { key: 'title', title: 'Название', type: 'string', readonly: false, showOnTable: true },
            { key: 'description', title: 'Описание', type: 'text', readonly: false, showOnTable: true },
        ]
    },

};

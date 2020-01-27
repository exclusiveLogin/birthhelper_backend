module.exports = {
    ent_services: {
        db_name: 'services',
        filters: [
            {
                name: 'title',
                title: 'Название услуги',
                type: 'string',
            },
            {
                name: 'category',
                title: 'Категория услуги',
                type: 'id',
                db_name: 'dict_category_service'
            },
        ],
        fields:[ 
            { key: 'id', title: 'ID услуги', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название услуги', required: true, showOnTable: true }, 
            { 
                key: 'category', 
                title: 'Категория услуги', 
                dctKey: 'dict_category_service', 
                type: 'id', 
                useDict: true, 
                canBeNull: false, 
                initData: 1, 
                required: true,
                showOnTable: true
            }, 
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
            { key: 'type', type: 'id', hide: true  }, 
            { key: 'adv', title: 'Рекламная услуга', type: 'flag', showOnTable: false  },
        ]
    },

    ent_service_containers: { 
        db_name: 'services_containers_repo',
        filters: [],
        container: 'container_services',
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
        filters: [
            {
                name: 'title',
                title: 'По названию',
                type: 'string',
            },
        ],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название клиники', required: true, showOnTable: true }, 
            { key: 'description', title: 'Описание клиники', type: 'text', showOnTable: true },
            { 
                key: 'address_id', 
                title: 'Адрес клиники', 
                dctKey: 'dict_address_id', 
                type: 'id', 
                useDict: true, 
                canBeNull: false,
                required: true,
                showOnTable: true,
            },
            {
                key: 'district',
                title: 'Регион москвы',
                required: true,
                type: 'id',
                useDict: true,
                canBeNull: false,
                showOnTable: true,
                dctKey: 'dict_district',
                titleDictKey: 'title_short'
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

    ent_services_slots: {
        db_name: 'service_slot',
        filters: [],
        container: null,
        slot: 'slot_service_natal',
        fields: [
            { key: 'id', title: 'ID слота', type: 'id', readonly: true, showOnTable: false },
            { key: 'title', type: 'string', title: 'Название', required: false, showOnTable: true },
            { key: 'service_id', type: 'string', title: 'id услуги', required: true, showOnTable: true, readonly: true },
            { key: 'contragent_id', type: 'string', title: 'id клиники', required: true, showOnTable: true, readonly: true },
            { key: 'price', type: 'string', title: 'цена услуги', required: true, showOnTable: true },
            {
                key: 'type',
                title: 'Тип услуги',
                required: false,
                type: 'id',
                proxyTo: 'name',
                useDict: true,
                canBeNull: true,
                showOnTable: true,
                dctKey: 'dict_slot_entity_type'
            }
        ],
        links: [
            { type: 'repo', title: 'Таблица услуг системы', entKey: 'services', multiselect: false, entType: 'entity', proxyTo: 'service_id'},
            { type: 'repo', title: 'Таблица клиник системы', entKey: 'clinics', multiselect: false, entType: 'entity', proxyTo: 'contragent_id'},
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
            { key: 'id', title: 'ID телефона', type: 'id', readonly: true, showOnTable: true },
            { key: 'title', type: 'string', title: 'Название картинки', required: true, showOnTable: true },
            { key: 'description', title: 'Описание картинки', type: 'text', showOnTable: true },
            { key: 'url', title: 'url изображения', type: 'text', required: true, showOnTable: true },
        ]
    },
};

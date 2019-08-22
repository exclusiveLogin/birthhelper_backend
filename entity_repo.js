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
            { key: 'gallery_id', type: 'id', hide: true, showOnTable: false }, 
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
    ent_clinics: {
        db_name: 'clinics',
        filters: [],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true, showOnTable: false }, 
            { key: 'title', type: 'string', title: 'Название клиники', required: true, showOnTable: true }, 
            // { 
            //     key: 'phone_container_id', 
            //     title: 'Телефоны клиники', 
            //     dctKey: 'dict_phone_container_id', 
            //     type: 'id', 
            //     useDict: true, 
            //     canBeNull: true
            // }, 
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
            { key: 'description', title: 'Описание', type: 'text', showOnTable: true },
            { key: 'comment', title: 'Комментарий', type: 'text', showOnTable: true },
            { key: 'items', title: 'Элементов', type: 'text', showOnTable: true, readonly: true },
        ],
        calculated: [
            { key: 'items', type: 'count', id_key: 'container_id', db_name: 'phone_containers' },
        ]
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
};
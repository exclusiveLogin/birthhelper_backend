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
            { key: 'id', title: 'ID услуги', type: 'id', readonly: true }, 
            { key: 'title', type: 'string', title: 'Название услуги', required: true }, 
            { 
                key: 'category', 
                title: 'Категория услуги', 
                dctKey: 'dict_category_service', 
                type: 'id', 
                useDict: true, 
                canBeNull: false, 
                initData: 1, 
                required: true 
            }, 
            { key: 'description', title: 'Описание услуги', type: 'text' }, 
            { key: 'article_id', type: 'id', hide: true }, 
            { key: 'gallery_id', type: 'id', hide: true }, 
            { 
                key: 'trimester', 
                type: 'id', 
                title: 'Триместер услуги', 
                useDict: true,
                dctKey: 'dict_trimester_service',
                canBeNull: true 
            }, 
            { key: 'type', type: 'id', hide: true  }, 
            { key: 'adv', title: 'Рекламная услуга', type: 'flag'  },
        ]
    },
    ent_clinics: {
        db_name: 'clinics',
        filters: [],
        fields: [
            { key: 'id', title: 'ID клиники', type: 'id', readonly: true }, 
            { key: 'title', type: 'string', title: 'Название клиники', required: true }, 
            // { 
            //     key: 'phone_container_id', 
            //     title: 'Телефоны клиники', 
            //     dctKey: 'dict_phone_container_id', 
            //     type: 'id', 
            //     useDict: true, 
            //     canBeNull: true
            // }, 
            { key: 'description', title: 'Описание клиники', type: 'text' },
            { 
                key: 'address_id', 
                title: 'Адресс клиники', 
                dctKey: 'dict_address_id', 
                type: 'id', 
                useDict: true, 
                canBeNull: false,
                required: true 
            }, 
            { 
                key: 'address_id2', 
                title: 'Адресс клиники', 
                dctKey: 'dict_address_id', 
                type: 'autocomplete', 
                useDict: true, 
                canBeNull: false,
                required: true 
            }, 
        ]
    },
    ent_districts: { 
        db_name: 'districts',
        filters: [],
        fields: [
            
        ]
    },
};
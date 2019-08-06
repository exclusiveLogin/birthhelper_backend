module.exports = {
    dict_category_service: { db: 'category_service' },
    dict_trimester_service: { db: 'trimester' },
    dict_clinics: { db: 'clinics' },
    dict_district: { db: 'district' },
    dict_address_id: { 
        db: 'address_container',
        titleMap: [
            'address_str'
        ],
        titleAddMap: [
            'position_lat',
            'position_lon'
        ]
    },
    dict_phone_container: { db: 'phone_container' }
};
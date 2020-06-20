module.exports = {
    dict_category_service: { db: 'category_service' },
    dict_trimester_service: { db: 'trimester' },
    dict_clinics: { db: 'clinics' },
    dict_district: { db: 'districts' },
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
    dict_phone_container: { db: 'phone_container' },
    dict_slot_entity_type: { db: 'slot_entity_type'},
    dict_birth_clinic_type: { db: 'birth_clinic_type'},
    dict_doctor_position_type: { db: 'doctor_position_type'},
    dict_doctor_category_type: { db: 'doctor_category_type'}
};

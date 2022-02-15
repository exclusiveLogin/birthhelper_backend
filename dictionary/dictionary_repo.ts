export interface IDictionary {
    db: string;
    titleMap?: string[];
    titleAddMap?: string[];
    filters?: IDictionaryFilters[];
}

export interface IDictionaryFilters {
    key: string;
    value: string;
    type: 'string' | 'number' | 'flag';
}

export const dictionaries: { [key: string]: IDictionary } = {
    dict_trimester_service: {db: 'trimester'},
    dict_clinics: {db: 'clinics'},
    dict_contragents: {db: 'contragents'},
    dict_placement: {
        db: 'services',
        filters: [
            {
                key: 'slot_category_type',
                type: 'number',
                value: '2',
            }
        ]
    },
    dict_district: {db: 'districts'},
    dict_address_id: {
        db: 'addresses',
        titleMap: [
            'address_str'
        ],
        titleAddMap: [
            'position_lat',
            'position_lon'
        ]
    },
    dict_phone_container: {db: 'phones_containers_repo'},
    dict_entity_type: {db: 'entity_type'},
    dict_birthtype: {db: 'birthtype'},
    dict_doctor_position_type: {db: 'doctor_position_type'},
    dict_doctor_category_type: {db: 'doctor_category_type'},
    dict_specialities_clinic_type: {db: 'specialities_clinic_type'},
    dict_clinic_specialities_containers_repo: {db: 'clinic_specialities_containers_repo'},
    dict_facilities_type: {db: 'facilities_type'},
    dict_facilities_containers_repo: {db: 'facilities_containers_repo'},
    dict_slot_category_type: {db: 'slot_category_type'},
    dict_order_status_type: {db: 'order_status_type'},
    dict_user_status_type: {db: 'user_status_type'},
    dict_user_role_type: {db: 'role'},
    dict_lk_permission_type: {db: 'lk_permission_type'},
};

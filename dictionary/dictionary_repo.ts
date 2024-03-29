export interface IDictionary {
    db: string;
    titleMap?: string[];
    titleAddMap?: string[];
    filters?: IDictionaryFilters[];
    autocomplete?: IDictionaryAutocompleteFilters[];
}

export interface IDictionaryFilters {
    key: string;
    value: string;
    type: 'string' | 'number' | 'flag';
}

export interface IDictionaryAutocompleteFilters {
    key: string;
    field: string;
    type: 'string' | 'number' | 'flag';
}

export const dictionaries: Record<string, IDictionary> = {
    dict_trimester_service: {db: 'trimester'},
    dict_clinics: {db: 'clinics'},
    dict_consultations: {db: 'consultation'},
    dict_contragents: {db: 'contragents'},
    dict_contragent_clinics: {
        db: 'contragents',
        filters: [
            {
                key: 'section_clinic',
                type: 'flag',
                value: '1',
            }
        ],
    },
    dict_contragent_consultations: {
        db: 'contragents',
        filters: [
            {
                key: 'section_consultation',
                type: 'flag',
                value: '1',
            }
        ],
    },
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
    dict_district: {db: 'districts', autocomplete: [
            {key: 'title', field: 'title', type: 'string'},
            {key: 'name', field: 'name', type: 'string'}
        ]},
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
    dict_section_type: {db: 'section_type'},
    dict_votes: {db: 'vote_type'},
    dict_feedback_entity_type: {db: 'feedback_entity_type'},
};

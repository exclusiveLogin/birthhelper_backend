export interface Clinic {
    id: number;
    active: boolean;
    address_id: number;
    phone_container_id: number;
    title: string;
    description: string;
    image_id: number;
    license: string;
    status_iho: boolean;
    has_oms: boolean;
    has_dms: boolean;
    has_reanimation: boolean;
    has_consultation: boolean;
    stat_male: number;
    stat_female: number;
    foreign_service: boolean;
    mom_with_baby: boolean;
    free_meets: boolean;
    facilities_type: number;
    specialities_type: number;
}

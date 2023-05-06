export interface LKPermission {
    id: number;
    user_id: number;
    contragent_entity_key: string;	
    contragent_entity_id: number;	
    permission_id: number;	
    datetime_create: string;	
    datetime_update: string;
}

export const enum  LKPermissionType {
    ORDERS = 1,
    SETTINGS = 2,
    FEEDBACK = 3,
}
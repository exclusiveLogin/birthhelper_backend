module.exports = {
    slot_service_natal = {
        name: 'slot_service_natal',
        title: 'Слоты для услуг родовспоможения',
        db_entity: 'services', // БД сущностей
        entity_fields: ['title', 'description'], // поля для сущности
        overrided_fields: ['price'], // поля доступные для перекрытия 
        db_links: 'service_slot', // БД связей
        entity_key: 'ent_services', // ключ сущности
    }
}
module.exports = {
    slot_service_natal: {
        name: 'slot_service_natal',
        title: 'Слоты для услуг родовспоможения',
        db_entity: 'services', // БД сущностей
        db_container: 'service_containers', // БД контейнеров,
        db_repo: 'services_containers_repo', //БД репозитория контейнеров
        entity_fields: ['title', 'description'], // поля для сущности которые показываем в информации о слоте(таблица, карточка)
        container_fields: ['title', 'description', 'comment'], //поля контейнера (container_repo)
        overrided_fields: ['price'], // поля доступные для перекрытия 
        required_fields: ['price', 'service_id', 'contragent_id', 'type'], //поля обязательные для слота
        required_fields_type: {
            'price': 'number',
            'service_id': 'number',
            'contragent_id': 'number',
            'type': 'string'
        }, //поля обязательные для слота
        db_links: 'service_slot', // БД связей
        entity_key: 'ent_services', // ключ сущности
        contragent_id_key: 'contragent_id', // название поля для хранения ссылки на КА
        entity_id_key: 'service_id', // название поля для хранения ссылки на сущность
    }
}

module.exports = {
    container_phones: {
        name: 'container_phones',
        title: 'Контейнеры телефонов в системе',
        db_entity: 'phones', // БД сущностей
        entity_fields: ['phone', 'title', 'description', 'comment'], // поля для 
        container_id_key: 'phone_id', // ключ связи контейнера и таблицы сущностей
        db_list: 'phones_containers_repo', // БД списка существующих контейнеров данного типа
        db_links: 'phone_containers', // БД связей контейнеров
        entity_key: 'ent_phones', // ключ сущности
    }
}
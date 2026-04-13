# BirthHelper Backend — NestJS-style REST API

Серверная часть платформы [BirthHelper](https://github.com/exclusivelogin/birthhelper). TypeScript, архитектура engine-based (auth, entity, container, cache, search, feedback, orders), PostgreSQL, Docker.

## Архитектура

Бэкенд построен на паттерне движков (engines): каждый домен инкапсулирует бизнес-логику, репозиторий данных и API-эндпоинты.

```
birthhelper_backend/
├── api/
│   ├── admin_rest.ts          # Admin REST API — CRUD для всех сущностей
│   └── api_rest.ts            # Public API — поиск, каталог, заказы
├── auth/
│   ├── auth.engine.ts         # JWT-авторизация, сессии, роли
│   └── lk.permissions.model.ts # Модель разрешений личного кабинета
├── cache.engine/
│   └── cache_engine.ts        # In-memory кэширование с TTL
├── config/
│   ├── config_engine.ts       # Конфигурация сущностей
│   └── entity/                # Конфигурации: clinic.config, consultation.config
├── container/
│   └── container_engine.ts    # Контейнерная система (группировка сущностей)
├── entity/
│   ├── entity_engine.ts       # CRUD-операции, фильтрация, валидация
│   ├── entity_repo.ts         # SQL-репозиторий (PostgreSQL)
│   └── utils.ts               # Утилиты преобразования данных
├── search/
│   ├── engine.ts              # Поисковый движок: пайплайны, секции
│   ├── piplines.engine.ts     # Построение SQL-пайплайнов
│   └── sections.handler.ts    # Обработка секций результатов
├── feedback/
│   └── feedback_engine.ts     # Отзывы, рейтинги
├── orders/
│   └── orders_engine.ts       # Обработка заказов
├── slot/
│   └── slot_engine.ts         # Управление слотами бронирования
├── dictionary/
│   └── dictionary_engine.ts   # Справочники
├── comment/ & like/ & tag/    # Комментарии, лайки, теги
├── db/
│   ├── sql.ts                 # PostgreSQL connection pool
│   └── sql.helper.ts          # SQL-хелперы
├── server.ts                  # Точка входа
├── backup/birthhelper.sql     # SQL-дамп базы
├── Dockerfile                 # Docker-образ
├── compose-dev.yaml           # Docker Compose для разработки
└── ecosystem.config.js        # PM2 конфигурация
```

## Стек технологий

| Технология | Назначение |
|-----------|-----------|
| TypeScript | Основной язык |
| Express.js | HTTP-сервер |
| PostgreSQL | Основная база данных |
| PM2 | Process management (продакшн) |
| Docker + Docker Compose | Контейнеризация |
| Dotenv Vault | Управление секретами |

## Движки (Engines)

| Engine | Назначение |
|--------|-----------|
| `auth.engine` | JWT-аутентификация, сессии, LK-разрешения |
| `entity_engine` | Универсальный CRUD для всех типов сущностей |
| `container_engine` | Группировка и иерархия сущностей |
| `cache_engine` | In-memory кэш с моделью инвалидации |
| `search.engine` | Поисковые пайплайны, фильтрация, секционирование |
| `feedback_engine` | Отзывы, рейтинги, модерация |
| `orders_engine` | Заказы: создание, статусы, история |
| `slot_engine` | Слоты бронирования врачей |
| `config_engine` | Конфигурация форм и полей для admin-панели |

## Запуск

```bash
npm install

# Настройка БД
# Создать PostgreSQL базу, импортировать backup/birthhelper.sql
# Настроить .env (или npx dotenv-vault pull)

# Разработка
npm run dev

# Продакшн
pm2 start ecosystem.config.js

# Docker
docker-compose -f compose-dev.yaml up -d
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/auth/login` | Авторизация |
| GET | `/api/search` | Поиск клиник / консультаций |
| GET | `/api/entity/:type/:id` | Получение сущности |
| POST | `/admin/entity/:type` | Создание сущности (admin) |
| PUT | `/admin/entity/:type/:id` | Обновление (admin) |
| GET | `/api/orders` | Заказы пользователя |
| POST | `/api/feedback` | Отправка отзыва |

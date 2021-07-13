-- phpMyAdmin SQL Dump
-- version 4.6.6deb5
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Сен 28 2020 г., 22:03
-- Версия сервера: 5.7.31-0ubuntu0.18.04.1
-- Версия PHP: 7.2.24-0ubuntu0.18.04.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `birthhelper`
--

-- --------------------------------------------------------

--
-- Структура таблицы `address_container`
--

CREATE TABLE `address_container` (
  `id` int(11) NOT NULL,
  `address_str` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `country` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `city` text,
  `street` text,
  `building` int(11) DEFAULT NULL,
  `letera` varchar(5) DEFAULT NULL,
  `block` varchar(5) DEFAULT NULL,
  `position_lat` float DEFAULT NULL,
  `position_lon` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `address_container`
--

INSERT INTO `address_container` (`id`, `address_str`, `country`, `city`, `street`, `building`, `letera`, `block`, `position_lat`, `position_lon`) VALUES
(1, 'г. Москва, Верхняя Первомайская ул., 57', NULL, NULL, NULL, NULL, NULL, NULL, 55.8001, 37.8021),
(2, 'г. Москва, Вешняковская ул., 23', NULL, NULL, NULL, NULL, NULL, NULL, 55.7313, 37.8334),
(3, 'г. Москва, Фортунатовская ул., 1, к.2', NULL, NULL, NULL, NULL, NULL, NULL, 55.7917, 37.7393),
(4, 'г. Москва, Федеративный проспект,17', NULL, NULL, NULL, NULL, NULL, NULL, 55.7558, 37.8137),
(5, 'г. Москва, 8-я ул. Соколиной Горы, 15', NULL, NULL, NULL, NULL, NULL, NULL, 55.7691, 37.7395),
(6, 'г. Москва, Барболина ул., 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.7874, 37.688),
(7, 'г. Москва, Таймырская ул., 6.', NULL, NULL, NULL, NULL, NULL, NULL, 55.8852, 37.706),
(8, 'г. Москва, Костромская ул., 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.8881, 37.5928),
(9, 'г. Москва, Ленская ул., 15, к.1', NULL, NULL, NULL, NULL, NULL, NULL, 55.8657, 37.6635),
(10, 'г. Москва, Нежинская ул., 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.7173, 37.477),
(11, 'г. Москва, Маршала Тимошенко ул., 15', NULL, NULL, NULL, NULL, NULL, NULL, 55.7491, 37.3808),
(12, 'г. Москва, 800-летия Москвы ул., 22, к.2', NULL, NULL, NULL, NULL, NULL, NULL, 55.8779, 37.555),
(13, 'г. Москва, Коптевский б-р, 5', NULL, NULL, NULL, NULL, NULL, NULL, 55.83, 37.5285),
(14, 'г. Москва, 4-й Вятский пер., 39', NULL, NULL, NULL, NULL, NULL, NULL, 55.7996, 37.5697),
(15, 'г. Москва, Правды ул., 15/1', NULL, NULL, NULL, NULL, NULL, NULL, 55.787, 37.5781),
(16, 'г. Москва, 3-я Красногвардейская ул., 1', NULL, NULL, NULL, NULL, NULL, NULL, 55.7579, 37.5411),
(17, 'г. Москва, Ленинский пр., 8, к.4', NULL, NULL, NULL, NULL, NULL, NULL, 55.726, 37.606),
(18, 'г. Москва, Еланского ул., 2', NULL, NULL, NULL, NULL, NULL, NULL, 55.7339, 37.5731),
(19, 'г. Москва, Покровка ул., д.22а', NULL, NULL, NULL, NULL, NULL, NULL, 55.759, 37.6489),
(20, 'г. Москва, Самаркандский б-р, 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.7036, 37.8283),
(21, 'г. Москва, Шарикоподшипниковская ул., 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.7234, 37.668),
(22, 'г. Москва, Гольяновская ул., 4a', NULL, NULL, NULL, NULL, NULL, NULL, 55.7756, 37.7065),
(23, 'г. Москва, Госпитальная пл., 2', NULL, NULL, NULL, NULL, NULL, NULL, 55.7665, 37.7005),
(24, 'г. Москва, Шкулева ул., 4', NULL, NULL, NULL, NULL, NULL, NULL, 55.6936, 37.7527),
(25, 'г. Москва, Севастопольский проспект 24, к.1', NULL, NULL, NULL, NULL, NULL, NULL, 55.6696, 37.5803),
(26, 'г. Москва, Академика Опарина ул., 4', NULL, NULL, NULL, NULL, NULL, NULL, 55.6445, 37.5005),
(27, 'г. Москва, Новаторов ул., 3', NULL, NULL, NULL, NULL, NULL, NULL, 55.6622, 37.5258),
(28, 'г. Москва, Азовская ул., 22', NULL, NULL, NULL, NULL, NULL, NULL, 55.6545, 37.5978),
(29, 'г. Москва, Фотиевой ул., 6', NULL, NULL, NULL, NULL, NULL, NULL, 55.7019, 37.5631),
(30, 'г. Москва, Волоколамское ш., 63 ', NULL, NULL, NULL, NULL, NULL, NULL, 55.8171, 37.4584),
(31, 'г. Москва, Ленская ул., 15, к.1 ', NULL, NULL, NULL, NULL, NULL, NULL, 55.8657, 37.6634),
(32, 'г. Москва, Вилиса Лациса ул., 4 ', NULL, NULL, NULL, NULL, NULL, NULL, 55.8661, 37.431),
(33, 'г. Москва, Сосновая ул., 11 ', NULL, NULL, NULL, NULL, NULL, NULL, 55.8065, 37.4783),
(34, 'г. Москва, Саляма Адиля ул., 2', NULL, NULL, NULL, NULL, NULL, NULL, 55.7717, 37.4656);

-- --------------------------------------------------------

--
-- Структура таблицы `birth_clinic_type`
--

CREATE TABLE `birth_clinic_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `birth_clinic_type`
--

INSERT INTO `birth_clinic_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'Естественные', 'тут надо что то рассказать про роды...', NULL),
(2, NULL, 'Кесарево сечение', NULL, NULL),
(3, NULL, 'Мягкие', NULL, NULL),
(4, NULL, 'Партнерские', NULL, NULL),
(5, NULL, 'В воде', NULL, NULL),
(6, NULL, 'С рубцом на матке', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `category_service`
--

CREATE TABLE `category_service` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `category_service`
--

INSERT INTO `category_service` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'Поддержка беременности', NULL, NULL),
(2, NULL, 'Родовспоможение', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `clinics`
--

CREATE TABLE `clinics` (
  `id` int(11) NOT NULL,
  `address_id` int(11) DEFAULT NULL,
  `phone_container_id` int(11) DEFAULT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `description` mediumtext COLLATE utf8_unicode_ci,
  `district` int(11) NOT NULL,
  `license` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status_iho` tinyint(1) DEFAULT NULL,
  `has_oms` tinyint(1) DEFAULT NULL,
  `has_dms` tinyint(1) DEFAULT NULL,
  `has_reanimation` tinyint(1) DEFAULT NULL,
  `has_consultation` tinyint(1) DEFAULT NULL,
  `stat_male` int(11) DEFAULT '0',
  `stat_female` int(11) NOT NULL DEFAULT '0',
  `foreign_service` tinyint(1) DEFAULT NULL,
  `mom_with_baby` tinyint(1) DEFAULT NULL,
  `free_meets` tinyint(1) DEFAULT NULL,
  `facilities_type` int(11) DEFAULT NULL,
  `specialities_type` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `clinics`
--

INSERT INTO `clinics` (`id`, `address_id`, `phone_container_id`, `title`, `description`, `district`, `license`, `status_iho`, `has_oms`, `has_dms`, `has_reanimation`, `has_consultation`, `stat_male`, `stat_female`, `foreign_service`, `mom_with_baby`, `free_meets`, `facilities_type`, `specialities_type`) VALUES
(1, 1, 1, 'Родильный дом №_20', 'филиал ГКБ им. Д.Д.Плетнёва', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(2, 2, 1, 'Родильный дом ГКБ №15 ', 'им. О.М. Филатова', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 1, 1),
(3, 3, 1, 'Родильный дом ГКБ №36', 'им. Ф.И. Иноземцева', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(4, 4, 1, 'Родильный дом ГКБ №70', 'им. Е.О. Мухина', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(5, 5, 1, 'Родильный дом при инфекционной больнице №2', '', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(6, 6, 1, 'Родильный дом при туберкулезной больнице №7', '', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(7, 7, 1, 'Родильный дом № 5', 'при ГКБ № 40', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(8, 8, 1, 'Родильный дом №11 (Родильное отделение №2)', 'филиал при ГКБ им.А.К.Ерамишанцева', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(9, 9, 1, 'Роддом больницы №20 ', 'Родильное отделение №1 ГБУЗ \"ГКБ им. А.К. Ерамишанцева', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(10, 10, 1, 'Родильный дом №3', 'Центр Планирования семьи и репродукции Департамента здравоохранения города Москвы».', 4, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(11, 11, 1, 'Родильный дом при ЦКБ ', 'Управления Делами Президента РФ', 4, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(12, 12, 1, 'Родильный дом №17', '', 5, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(13, 13, 1, 'Родильный дом №27', 'филиал ГКБ №50 им.С.И.Спасокукоцкого', 5, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(14, 14, 1, 'Роддом при городской больнице №8', 'Филиал \"Перинатальный центр\" ГКБ №24', 5, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(15, 15, 1, 'Родильный дом ЕМС', 'Европейский медицинский центр', 5, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(16, 16, 1, 'Родильный дом ГКБ №32', 'Филиал №2 Родильный дом ГКБ имени С.П.Боткина', 3, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(17, 17, 1, 'Родильный дом ГКБ №1', 'им.Н.И. Пирогова', 6, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(18, 18, 1, 'Клиника акушерства и гинекологии ', 'им. В.Ф. Снегирева', 6, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(19, 19, 1, 'Родильный дом при ГБУЗ МО МОНИИАГ', 'Московский областной НИИ акушерства и гинекологии', 6, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(20, 20, 1, 'Родильный дом №8', 'при ГКБ №24', 7, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(21, 21, 1, 'Родильный дом №15', '', 7, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(22, 22, 1, 'Родильный дом №18', '', 7, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(23, 23, 1, 'Родильный дом при ГКБ №29', '', 7, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(24, 24, 1, 'Родильный дом при ГКБ №68', '', 7, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(25, 25, 1, 'Перинатальный медицинский центр \"Мать и дитя\"', '', 8, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(26, 26, 1, 'ФГБУ «НМИЦ АГП им. В.И. Кулакова»', '', 8, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(27, 27, 1, 'Родильный дом №4', '', 8, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(28, 28, 1, 'Родильный дом №10', '', 8, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(29, 29, 1, 'Родильный дом №25', '', 8, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(30, 30, 1, 'Родильный дом при инфекционной КБ №1', '', 9, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(31, 31, 1, 'Родильный дом ГКБ №20 ', 'им.А.К.Ерамишанцева, отделение №1 ', 9, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(32, 32, 1, 'Родильный дом №1', '', 2, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(33, 33, 1, 'Родильный дом №26', 'при ГКБ № 52 ', 2, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(34, 34, 1, 'Родильный дом №67', 'Евромед ', 2, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(35, 19, NULL, 'Тестовая', NULL, 4, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `clinic_specialities_containers`
--

CREATE TABLE `clinic_specialities_containers` (
  `id` int(11) NOT NULL,
  `container_id` int(11) NOT NULL,
  `speciality_id` int(11) NOT NULL,
  `overrided_title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `overrided_description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `clinic_specialities_containers`
--

INSERT INTO `clinic_specialities_containers` (`id`, `container_id`, `speciality_id`, `overrided_title`, `overrided_description`, `comment`) VALUES
(1, 1, 2, NULL, NULL, NULL),
(2, 1, 1, NULL, NULL, NULL),
(3, 1, 3, NULL, NULL, NULL),
(4, 1, 4, NULL, NULL, NULL),
(5, 1, 5, NULL, NULL, NULL),
(6, 1, 6, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `clinic_specialities_containers_repo`
--

CREATE TABLE `clinic_specialities_containers_repo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `clinic_specialities_containers_repo`
--

INSERT INTO `clinic_specialities_containers_repo` (`id`, `title`, `description`, `comment`) VALUES
(1, 'Полная', 'Все специализации в одном месте', NULL),
(2, 'Удалить', 'ууццуц', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `clinic_specialities_type`
--

CREATE TABLE `clinic_specialities_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `clinic_specialities_type`
--

INSERT INTO `clinic_specialities_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'Инфекционные заболевания ', '(в том числе гепатиты, капельные инфекции)', NULL),
(2, NULL, 'Заболевания крови AB0- и Rh- сенсибилизация', NULL, NULL),
(3, NULL, 'Патология мочевыводящей системы', NULL, NULL),
(4, NULL, 'Заболевания сердечнососудистой системы', NULL, NULL),
(5, NULL, 'Патология сосудов', NULL, NULL),
(6, NULL, 'Сахарный диабет', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `districts`
--

CREATE TABLE `districts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `title` text COLLATE utf8_unicode_ci NOT NULL,
  `title_short` text COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `districts`
--

INSERT INTO `districts` (`id`, `name`, `title`, `title_short`) VALUES
(2, 'szao', 'Северо-западный автономный округ', 'СЗАО'),
(3, 'vao', 'Восточный автономный округ', 'ВАО'),
(4, 'ЗАО', 'Западный автономный округ', 'ЗАО'),
(5, 'САО', 'Северный автономный округ', 'САО'),
(6, 'ЦАО', 'Центральный автономный округ', 'ЦАО'),
(7, 'ЮВАО', 'Юго - восточный автономный округ', 'ЮВАО'),
(8, 'uzao', 'Юго - западный автономный округ', 'ЮЗАО'),
(9, 'svao', 'Северо - восточный автономный округ', 'СВАО');

-- --------------------------------------------------------

--
-- Структура таблицы `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `surname` varchar(50) DEFAULT NULL,
  `patronymic` varchar(50) DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Врач',
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `image_id` int(11) DEFAULT NULL,
  `article_id` int(11) DEFAULT NULL,
  `category` int(11) NOT NULL,
  `trimester` int(11) DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `adv` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Структура таблицы `doctor_category_type`
--

CREATE TABLE `doctor_category_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `doctor_category_type`
--

INSERT INTO `doctor_category_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(6, NULL, 'Высшая категория', NULL, NULL),
(7, NULL, 'Категория А', NULL, NULL),
(8, NULL, 'Категория B', NULL, NULL),
(9, NULL, 'Категория C', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `doctor_position_type`
--

CREATE TABLE `doctor_position_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `doctor_position_type`
--

INSERT INTO `doctor_position_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'Акушер-гинеколог', NULL, NULL),
(2, NULL, 'Врач-неонатолог', NULL, NULL),
(3, NULL, 'Врач-анестезиолог ', NULL, NULL),
(4, NULL, 'Акушерка', NULL, NULL),
(5, NULL, 'Доула', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `facilities_containers`
--

CREATE TABLE `facilities_containers` (
  `id` int(11) NOT NULL,
  `container_id` int(11) NOT NULL,
  `facility_id` int(11) NOT NULL,
  `overrided_title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `overrided_description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `facilities_containers`
--

INSERT INTO `facilities_containers` (`id`, `container_id`, `facility_id`, `overrided_title`, `overrided_description`, `comment`) VALUES
(7, 1, 5, NULL, NULL, NULL),
(8, 1, 4, NULL, NULL, NULL),
(9, 1, 6, NULL, NULL, NULL),
(10, 1, 3, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `facilities_containers_repo`
--

CREATE TABLE `facilities_containers_repo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `facilities_containers_repo`
--

INSERT INTO `facilities_containers_repo` (`id`, `title`, `description`, `comment`) VALUES
(1, 'Полный пакет', 'Все удобства', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `facilities_type`
--

CREATE TABLE `facilities_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `facilities_type`
--

INSERT INTO `facilities_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'wi-fi', NULL, NULL),
(2, NULL, 'телевизор', NULL, NULL),
(3, NULL, 'холодильник', NULL, NULL),
(4, NULL, 'фен', NULL, NULL),
(5, NULL, 'душ/туалет в палате', NULL, NULL),
(6, NULL, 'чайник', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `files`
--

CREATE TABLE `files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `filename` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `folder` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `files`
--

INSERT INTO `files` (`id`, `filename`, `folder`, `type`) VALUES
(3, 'l0MKBLXsGw4_1592469141029.jpg', 'uploads', 'image/jpeg'),
(4, 'PANO0001-Pano-2_1599718545444.jpg', 'uploads', 'image/jpeg'),
(10, 'IMG_20200712_205433_1_1599737749913.jpg', 'uploads', 'image/jpeg'),
(11, 'IMG_20200712_205438_1599737918472.jpg', 'uploads', 'image/jpeg'),
(12, 'IMG_20200712_205907_1_1599739855835.jpg', 'uploads', 'image/jpeg'),
(13, 'IMG_20200712_205624_1599740080911.jpg', 'uploads', 'image/jpeg'),
(14, 'PANO_20200711_142421_1599740190446.jpg', 'uploads', 'image/jpeg'),
(15, 'IMG_20200712_205433_1_1599740415565.jpg', 'uploads', 'image/jpeg'),
(16, 'IMG_20200712_205438_1599740683746.jpg', 'uploads', 'image/jpeg'),
(17, 'IMG_20200712_205801_1599740755152.jpg', 'uploads', 'image/jpeg'),
(18, 'IMG_20200712_205908_1_1599741787486.jpg', 'uploads', 'image/jpeg'),
(19, 'IMG_20200712_205801_1599741857593.jpg', 'uploads', 'image/jpeg'),
(20, 'PANO_20200711_142421_1599741982856.jpg', 'uploads', 'image/jpeg'),
(21, 'IMG_20200712_205527_1599744101404.jpg', 'uploads', 'image/jpeg'),
(22, 'IMG_20200712_205908_1_1599744137173.jpg', 'uploads', 'image/jpeg');

-- --------------------------------------------------------

--
-- Структура таблицы `images`
--

CREATE TABLE `images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `file_id` int(11) NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `datetime_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `datetime_create` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `images`
--

INSERT INTO `images` (`id`, `file_id`, `title`, `description`, `datetime_update`, `datetime_create`) VALUES
(4, 4, 'ThunderStorm', '', '2020-09-10 13:14:22', '2020-06-18 08:32:21'),
(5, 4, 'null', 'null', '2020-09-10 06:15:45', '2020-09-10 06:15:45'),
(6, 5, 'Pano', 'Voronezh', '2020-09-10 10:23:41', '2020-09-10 10:23:41'),
(7, 6, 'ter', 'rrr', '2020-09-10 10:38:08', '2020-09-10 10:38:08'),
(8, 7, 'riv', 'null', '2020-09-10 10:44:47', '2020-09-10 10:44:47'),
(9, 8, 'dfdf', 'null', '2020-09-10 10:56:35', '2020-09-10 10:56:35'),
(10, 9, 'null', 'null', '2020-09-10 11:03:45', '2020-09-10 11:03:45'),
(11, 10, 'rt', 'tt', '2020-09-10 11:35:50', '2020-09-10 11:35:50'),
(12, 11, 'null', 'null', '2020-09-10 11:38:39', '2020-09-10 11:38:39'),
(13, 12, 'плотина', 'null', '2020-09-10 12:10:56', '2020-09-10 12:10:56'),
(14, 13, 'null', 'null', '2020-09-10 12:14:38', '2020-09-10 12:14:38'),
(15, 14, 'null', 'null', '2020-09-10 12:16:29', '2020-09-10 12:16:29'),
(16, 15, 'null', 'null', '2020-09-10 12:20:13', '2020-09-10 12:20:13'),
(17, 16, 'null', 'null', '2020-09-10 12:24:41', '2020-09-10 12:24:41'),
(18, 17, 'null', 'null', '2020-09-10 12:25:53', '2020-09-10 12:25:53'),
(19, 20, 'null', 'null', '2020-09-10 12:44:22', '2020-09-10 12:43:05'),
(20, 19, 'null', 'null', '2020-09-10 12:44:15', '2020-09-10 12:44:15'),
(21, 20, 'null', 'null', '2020-09-10 12:46:20', '2020-09-10 12:46:20'),
(22, 21, 'null', 'null', '2020-09-10 13:21:40', '2020-09-10 13:21:40'),
(23, 22, 'null', 'null', '2020-09-10 13:22:15', '2020-09-10 13:22:15');

-- --------------------------------------------------------

--
-- Структура таблицы `phones`
--

CREATE TABLE `phones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `phone` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `phones`
--

INSERT INTO `phones` (`id`, `title`, `description`, `phone`, `comment`) VALUES
(1, 'Телефон 1', 'Телефон заведующей Клиники 15', '9171215000', NULL),
(2, 'Телефон 2', 'Телефон регистратуры Клиники 15', '34555343', NULL),
(3, 'Телефон 3', NULL, '44444', NULL),
(4, 'несортированный ', NULL, '4545454', NULL),
(5, 'тестовый', 'тест', '4893к7302роо8', 'тест'),
(6, 'тест2', 'тестовый телефон 2', '677899097', 'тест');

-- --------------------------------------------------------

--
-- Структура таблицы `phones_containers_repo`
--

CREATE TABLE `phones_containers_repo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `phones_containers_repo`
--

INSERT INTO `phones_containers_repo` (`id`, `title`, `description`, `comment`) VALUES
(14, 'Тестирование', 'описание', NULL),
(15, 'Еще один', NULL, NULL),
(16, 'И еще один', NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `phone_containers`
--

CREATE TABLE `phone_containers` (
  `id` int(11) NOT NULL,
  `container_id` int(11) NOT NULL,
  `phone_id` int(11) NOT NULL,
  `overrided_title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `overrided_description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `phone_containers`
--

INSERT INTO `phone_containers` (`id`, `container_id`, `phone_id`, `overrided_title`, `overrided_description`, `comment`) VALUES
(69, 15, 1, NULL, NULL, NULL),
(70, 15, 2, NULL, NULL, NULL),
(73, 14, 2, NULL, NULL, NULL),
(74, 14, 4, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `image_id` int(11) DEFAULT NULL,
  `article_id` int(11) DEFAULT NULL,
  `category` int(11) NOT NULL,
  `trimester` int(11) DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `adv` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `services`
--

INSERT INTO `services` (`id`, `title`, `description`, `image_id`, `article_id`, `category`, `trimester`, `type`, `adv`) VALUES
(1, 'Highcharts Demo', 'кке', 5, NULL, 2, NULL, NULL, NULL),
(2, 'Highcharts Demof', NULL, 23, NULL, 1, NULL, NULL, NULL),
(3, 'VIP  Палата', 'Палата для богатых девах', NULL, NULL, 2, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `services_containers_repo`
--

CREATE TABLE `services_containers_repo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `services_containers_repo`
--

INSERT INTO `services_containers_repo` (`id`, `title`, `description`, `comment`) VALUES
(4, 'Родовспоможение VIP', 'какое то описание пакета', NULL),
(5, 'Стандартные роды', 'аава', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `service_containers`
--

CREATE TABLE `service_containers` (
  `id` int(11) NOT NULL,
  `container_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `overrided_title` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `overrided_description` text COLLATE utf8_unicode_ci,
  `comment` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `service_containers`
--

INSERT INTO `service_containers` (`id`, `container_id`, `service_id`, `overrided_title`, `overrided_description`, `comment`) VALUES
(12, 4, 21, NULL, NULL, NULL),
(13, 4, 22, NULL, NULL, NULL),
(14, 4, 24, NULL, NULL, NULL),
(15, 5, 20, NULL, NULL, NULL),
(16, 5, 25, NULL, NULL, NULL),
(17, 5, 22, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `service_slot`
--

CREATE TABLE `service_slot` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `service_id` int(20) NOT NULL,
  `price` int(20) NOT NULL,
  `benefit_price` int(11) DEFAULT NULL,
  `benefit_percent` int(11) DEFAULT NULL,
  `contragent_id` int(11) NOT NULL,
  `type` int(1) NOT NULL DEFAULT '1',
  `service_type` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `service_slot`
--

INSERT INTO `service_slot` (`id`, `title`, `service_id`, `price`, `benefit_price`, `benefit_percent`, `contragent_id`, `type`, `service_type`) VALUES
(1, 'Демо услуга', 20, 200013, NULL, NULL, 1, 1, NULL),
(3, 'Демо услуга 2', 20, 777, NULL, NULL, 2, 1, NULL),
(4, '3 скрининг', 25, 9720000, NULL, NULL, 9, 1, NULL),
(5, 'роды', 5, 1000000, NULL, NULL, 7, 2, NULL),
(6, 'VIP Палата', 3, 200000, NULL, NULL, 1, 1, 2);

-- --------------------------------------------------------

--
-- Структура таблицы `slot_clinic_type`
--

CREATE TABLE `slot_clinic_type` (
  `id` int(11) NOT NULL,
  `icon` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `bg_color` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `slot_clinic_type`
--

INSERT INTO `slot_clinic_type` (`id`, `icon`, `title`, `description`, `bg_color`) VALUES
(1, NULL, 'Персонал', 'Сотрудники клиники.', NULL),
(2, NULL, 'Размещение', 'Палаты и зоны отдыха клиники', NULL),
(3, NULL, 'Вид родов', 'Различные типы родовспоможения, в воду, кесарево и пр пр ', NULL),
(4, NULL, 'Дополнительные услуги', 'Фото видео и пр вещи которые может предоставить роддом', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `slot_entity_type`
--

CREATE TABLE `slot_entity_type` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `comment` text COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Дамп данных таблицы `slot_entity_type`
--

INSERT INTO `slot_entity_type` (`id`, `title`, `name`, `comment`) VALUES
(1, 'Сущность', 'entity', ''),
(2, 'Контейнер', 'container', '');

-- --------------------------------------------------------

--
-- Структура таблицы `trimester`
--

CREATE TABLE `trimester` (
  `id` int(11) NOT NULL,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(50) CHARACTER SET utf32 COLLATE utf32_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `icon` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `bg_color` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `article_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Дамп данных таблицы `trimester`
--

INSERT INTO `trimester` (`id`, `name`, `title`, `description`, `icon`, `bg_color`, `article_id`) VALUES
(1, 'first', 'Первый триместер', '', NULL, NULL, NULL),
(2, 'second', 'Второй триместер', '', NULL, NULL, NULL),
(3, 'third', 'Третий триметр', '', NULL, NULL, NULL);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `address_container`
--
ALTER TABLE `address_container`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `birth_clinic_type`
--
ALTER TABLE `birth_clinic_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `category_service`
--
ALTER TABLE `category_service`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `clinics`
--
ALTER TABLE `clinics`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `clinic_specialities_containers`
--
ALTER TABLE `clinic_specialities_containers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `clinic_specialities_containers_repo`
--
ALTER TABLE `clinic_specialities_containers_repo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `clinic_specialities_type`
--
ALTER TABLE `clinic_specialities_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `doctor_category_type`
--
ALTER TABLE `doctor_category_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `doctor_position_type`
--
ALTER TABLE `doctor_position_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `facilities_containers`
--
ALTER TABLE `facilities_containers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `facilities_containers_repo`
--
ALTER TABLE `facilities_containers_repo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `facilities_type`
--
ALTER TABLE `facilities_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `images`
--
ALTER TABLE `images`
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `phones`
--
ALTER TABLE `phones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `phones_containers_repo`
--
ALTER TABLE `phones_containers_repo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `phone_containers`
--
ALTER TABLE `phone_containers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `services_containers_repo`
--
ALTER TABLE `services_containers_repo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `service_containers`
--
ALTER TABLE `service_containers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `service_slot`
--
ALTER TABLE `service_slot`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `slot_clinic_type`
--
ALTER TABLE `slot_clinic_type`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `slot_entity_type`
--
ALTER TABLE `slot_entity_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Индексы таблицы `trimester`
--
ALTER TABLE `trimester`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `address_container`
--
ALTER TABLE `address_container`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;
--
-- AUTO_INCREMENT для таблицы `birth_clinic_type`
--
ALTER TABLE `birth_clinic_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT для таблицы `category_service`
--
ALTER TABLE `category_service`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT для таблицы `clinics`
--
ALTER TABLE `clinics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;
--
-- AUTO_INCREMENT для таблицы `clinic_specialities_containers`
--
ALTER TABLE `clinic_specialities_containers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT для таблицы `clinic_specialities_containers_repo`
--
ALTER TABLE `clinic_specialities_containers_repo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT для таблицы `clinic_specialities_type`
--
ALTER TABLE `clinic_specialities_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT для таблицы `districts`
--
ALTER TABLE `districts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT для таблицы `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT для таблицы `doctor_category_type`
--
ALTER TABLE `doctor_category_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT для таблицы `doctor_position_type`
--
ALTER TABLE `doctor_position_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT для таблицы `facilities_containers`
--
ALTER TABLE `facilities_containers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT для таблицы `facilities_containers_repo`
--
ALTER TABLE `facilities_containers_repo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT для таблицы `facilities_type`
--
ALTER TABLE `facilities_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
--
-- AUTO_INCREMENT для таблицы `files`
--
ALTER TABLE `files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
--
-- AUTO_INCREMENT для таблицы `images`
--
ALTER TABLE `images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;
--
-- AUTO_INCREMENT для таблицы `phones`
--
ALTER TABLE `phones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT для таблицы `phones_containers_repo`
--
ALTER TABLE `phones_containers_repo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT для таблицы `phone_containers`
--
ALTER TABLE `phone_containers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;
--
-- AUTO_INCREMENT для таблицы `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT для таблицы `services_containers_repo`
--
ALTER TABLE `services_containers_repo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT для таблицы `service_containers`
--
ALTER TABLE `service_containers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
--
-- AUTO_INCREMENT для таблицы `service_slot`
--
ALTER TABLE `service_slot`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT для таблицы `slot_clinic_type`
--
ALTER TABLE `slot_clinic_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT для таблицы `slot_entity_type`
--
ALTER TABLE `slot_entity_type`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT для таблицы `trimester`
--
ALTER TABLE `trimester`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-05-2026 a las 23:54:49
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sibet_notas`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notes`
--

CREATE TABLE `notes` (
  `id` int(10) UNSIGNED NOT NULL,
  `uuid` char(36) NOT NULL,
  `topic` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`tags`)),
  `priority` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `reminder` datetime DEFAULT NULL,
  `favorite` tinyint(1) NOT NULL DEFAULT 0,
  `archived` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notes`
--

INSERT INTO `notes` (`id`, `uuid`, `topic`, `title`, `description`, `tags`, `priority`, `reminder`, `favorite`, `archived`, `created_at`, `updated_at`) VALUES
(3, '4e154a3c-22a7-499f-882a-bb38af854a72', 'Personal', 'Link\'s importantes', '<a href=\"https://ckeditor.com/mathtype/#ckeditor5\">https://ckeditor.com/mathtype/#ckeditor5</a><div><a href=\"https://libros.edicioneslexicom.pe/login\">https://libros.edicioneslexicom.pe/login</a><br></div><div><a href=\"https://www.udemy.com\">https://www.udemy.com</a><br></div>', '[\"clases\"]', 2, '2026-05-12 16:46:00', 0, 0, '2026-05-12 16:48:23', '2026-05-12 16:48:23');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notes_uuid` (`uuid`),
  ADD KEY `idx_notes_topic` (`topic`),
  ADD KEY `idx_notes_priority` (`priority`),
  ADD KEY `idx_notes_favorite` (`favorite`),
  ADD KEY `idx_notes_archived` (`archived`),
  ADD KEY `idx_notes_updated_at` (`updated_at`);
ALTER TABLE `notes` ADD FULLTEXT KEY `ft_notes_search` (`title`,`description`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE DATABASE IF NOT EXISTS sibet_notas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sibet_notas;

CREATE TABLE IF NOT EXISTS notes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  topic VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description MEDIUMTEXT NULL,
  tags JSON NOT NULL,
  priority TINYINT UNSIGNED NOT NULL DEFAULT 2,
  reminder DATETIME NULL,
  favorite TINYINT(1) NOT NULL DEFAULT 0,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notes_uuid (uuid),
  KEY idx_notes_topic (topic),
  KEY idx_notes_priority (priority),
  KEY idx_notes_favorite (favorite),
  KEY idx_notes_archived (archived),
  KEY idx_notes_updated_at (updated_at),
  FULLTEXT KEY ft_notes_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notes (
  uuid,
  topic,
  title,
  description,
  tags,
  priority,
  reminder,
  favorite,
  archived
) VALUES
(
  UUID(),
  'Trabajo',
  'Seguimiento de reunion semanal',
  '<p><strong>Prioridades:</strong> cerrar pendientes del tablero, validar presupuesto y confirmar responsables.</p><ul><li>Enviar resumen al equipo.</li><li>Preparar puntos para la siguiente sesion.</li></ul>',
  JSON_ARRAY('reuniones', 'pendientes', 'equipo'),
  3,
  NULL,
  1,
  0
),
(
  UUID(),
  'Ideas',
  'Banco de ideas para contenidos',
  '<p>Guardar referencias, frases utiles y ejemplos visuales para convertirlos luego en publicaciones.</p>',
  JSON_ARRAY('creatividad', 'contenido'),
  2,
  NULL,
  0,
  0
);

PARA EMOVER LAS TABLAS A OTRA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS sibet_ingresos1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sibet_ingresos;
RENAME TABLE sibet_ingresos.entidades TO sibet_ingresos1.entidades;
RENAME TABLE sibet_ingresos.tipos_pago TO sibet_ingresos1.tipos_pago;
RENAME TABLE sibet_ingresos.transacciones TO sibet_ingresos1.transacciones
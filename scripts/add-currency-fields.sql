-- Script para agregar campos de moneda a la tabla producto_proveedor
-- Ejecutar este script directamente en la base de datos de producción

ALTER TABLE "producto_proveedor" 
ADD COLUMN IF NOT EXISTS "moneda" TEXT DEFAULT 'UYU',
ADD COLUMN IF NOT EXISTS "precioEnDolares" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "precioEnPesos" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "cotizacionUsada" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "fechaCotizacion" TIMESTAMP;

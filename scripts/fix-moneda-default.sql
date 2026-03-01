-- Script para eliminar el DEFAULT de la columna moneda
-- Esto evita que PostgreSQL use 'UYU' cuando el valor es NULL
-- Ejecutar en Supabase SQL Editor

ALTER TABLE "producto_proveedor" 
ALTER COLUMN "moneda" DROP DEFAULT;

-- Verificar que el DEFAULT se eliminó
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'producto_proveedor'
  AND column_name = 'moneda';

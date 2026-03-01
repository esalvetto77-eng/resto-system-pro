-- Script completo para agregar TODOS los campos nuevos a la tabla producto_proveedor
-- Ejecutar este script directamente en Supabase SQL Editor
-- IMPORTANTE: Ejecutar en el orden mostrado

-- 1. Campos de moneda (si no existen ya)
ALTER TABLE "producto_proveedor" 
ADD COLUMN IF NOT EXISTS "moneda" TEXT DEFAULT 'UYU',
ADD COLUMN IF NOT EXISTS "precioEnDolares" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "precioEnPesos" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "cotizacionUsada" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "fechaCotizacion" TIMESTAMP;

-- 2. Campos de presentación del producto
ALTER TABLE "producto_proveedor"
ADD COLUMN IF NOT EXISTS "unidadCompra" TEXT,
ADD COLUMN IF NOT EXISTS "cantidadPorUnidadCompra" DOUBLE PRECISION;

-- 3. Campos de IVA
ALTER TABLE "producto_proveedor"
ADD COLUMN IF NOT EXISTS "tipoIVA" TEXT,
ADD COLUMN IF NOT EXISTS "precioIngresadoConIVA" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "precioConIVA" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "precioSinIVA" DOUBLE PRECISION;

-- Verificar que todas las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'producto_proveedor'
  AND column_name IN (
    'moneda', 
    'precioEnDolares', 
    'precioEnPesos', 
    'cotizacionUsada', 
    'fechaCotizacion',
    'unidadCompra',
    'cantidadPorUnidadCompra',
    'tipoIVA',
    'precioIngresadoConIVA',
    'precioConIVA',
    'precioSinIVA'
  )
ORDER BY column_name;

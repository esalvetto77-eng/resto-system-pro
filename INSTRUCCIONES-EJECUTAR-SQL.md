# 📋 INSTRUCCIONES PARA EJECUTAR SQL EN SUPABASE

## Paso 1: Acceder a Supabase
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (el que tiene tu base de datos)

## Paso 2: Abrir el SQL Editor
1. En el menú lateral izquierdo, busca y haz clic en **"SQL Editor"** (o "Editor SQL")
2. Si no lo ves, busca en el menú "Database" o "Base de datos"

## Paso 3: Crear una nueva consulta
1. Haz clic en el botón **"New query"** o **"Nueva consulta"** (generalmente está arriba a la izquierda)
2. Se abrirá un editor de texto donde puedes escribir SQL

## Paso 4: Pegar el SQL
Copia y pega este SQL completo:

```sql
-- Script completo para agregar TODOS los campos nuevos a la tabla producto_proveedor

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
```

## Paso 5: Ejecutar el SQL
1. Haz clic en el botón **"Run"** o **"Ejecutar"** (generalmente está arriba a la derecha, puede ser un botón verde o un ícono de "play" ▶️)
2. O presiona `Ctrl + Enter` (Windows) o `Cmd + Enter` (Mac)

## Paso 6: Verificar el resultado
- Deberías ver un mensaje de éxito como: "Success. No rows returned" o "Éxito"
- Si hay algún error, aparecerá en rojo. Avísame y lo solucionamos.

## ✅ Listo!
Después de ejecutar el SQL:
1. Espera 1-2 minutos
2. Recarga tu aplicación web
3. Prueba crear/editar un producto con moneda USD

---

## 🔍 Si no encuentras el SQL Editor:
- Busca en el menú: "Database" → "SQL Editor"
- O busca: "SQL" en la barra de búsqueda del dashboard
- O ve directamente a: `https://supabase.com/dashboard/project/[TU-PROYECTO]/sql`

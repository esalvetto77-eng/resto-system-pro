# Configuración de Cotización del Dólar BROU

## Descripción

El sistema ahora soporta precios en dólares (USD) y pesos uruguayos (UYU) para productos. La cotización del dólar se obtiene automáticamente, pero puedes configurar un valor manual si es necesario.

## Funcionalidades Implementadas

### 1. **Cotización del Dólar en Dashboard**
- La cotización del BROU se muestra en la esquina superior derecha del dashboard
- Se actualiza automáticamente cada hora
- Muestra el promedio de compra y venta

### 2. **Precios en Dólares para Productos**
- Al crear/editar un producto, puedes seleccionar la moneda (USD o UYU)
- Si ingresas precio en dólares, se muestra automáticamente el equivalente en pesos uruguayos
- El sistema guarda ambos valores (precio en dólares y precio en pesos)

### 3. **Visualización de Precios**
- En los listados de productos, se muestran ambos precios cuando corresponde
- Los precios en dólares muestran: `$XX.XX USD` y debajo `≈ $XXX.XX UYU`

## Configuración Manual de Cotización

Si necesitas configurar la cotización manualmente (por ejemplo, si la API no está disponible), puedes hacerlo de dos formas:

### Opción 1: Variable de Entorno (Recomendado)

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega una nueva variable:
   - **Name**: `COTIZACION_DOLAR_BROU`
   - **Value**: El valor del dólar (ejemplo: `40.00`)
   - **Environments**: Production, Preview, Development
4. Guarda y haz redeploy

### Opción 2: Actualizar el Código

Si prefieres actualizar el valor por defecto en el código:

1. Abre `src/app/api/cotizacion-dolar/route.ts`
2. Busca las líneas con valores por defecto:
   ```typescript
   compra: 39.5,
   venta: 40.0,
   ```
3. Actualiza con los valores actuales del BROU

## Obtener Cotización del BROU

El BROU no tiene una API pública oficial. El sistema intenta obtener la cotización desde:

1. **API de Exchange Rate** (fallback)
2. **Variable de entorno** `COTIZACION_DOLAR_BROU` (si está configurada)
3. **Valor por defecto** (si todo falla)

### Para obtener la cotización oficial del BROU:

1. Visita: https://www.brou.com.uy/web/guest/cotizaciones
2. Busca la cotización del dólar estadounidense (USD)
3. Usa el promedio entre compra y venta
4. Configúralo en la variable de entorno `COTIZACION_DOLAR_BROU`

## Migración de Base de Datos

**IMPORTANTE**: Después de hacer pull de estos cambios, necesitas ejecutar la migración de Prisma:

```bash
npx prisma migrate dev
```

O si estás en producción:

```bash
npx prisma migrate deploy
```

Esto agregará los nuevos campos a la tabla `producto_proveedor`:
- `moneda` (USD o UYU)
- `precioEnDolares`
- `precioEnPesos`
- `cotizacionUsada`
- `fechaCotizacion`

## Uso

### Crear Producto con Precio en Dólares

1. Ve a **Productos** → **Nuevo Producto**
2. Agrega un proveedor
3. Selecciona **Moneda**: USD
4. Ingresa el precio en dólares
5. Verás automáticamente el equivalente en pesos uruguayos
6. Guarda el producto

### Ver Precios en Listado

En el listado de productos, verás:
- Precios en USD con su equivalente en UYU
- Precios en UYU directamente
- El precio más barato se marca con una flecha ↓

## Notas

- La cotización se actualiza automáticamente cada hora
- Si la API falla, se usa el valor de la variable de entorno o el valor por defecto
- Los precios se guardan con la cotización del momento de creación/actualización
- Puedes actualizar productos existentes para recalcular precios con la nueva cotización

# Actualización Automática de Cotización del Dólar BROU

## Descripción

El sistema ahora actualiza automáticamente la cotización del dólar del BROU y recalcula los precios de productos en dólares a pesos uruguayos.

## Funcionalidades Implementadas

### 1. **Obtención Automática de Cotización**
- Intenta obtener la cotización desde la página web oficial del BROU
- Si falla, usa APIs alternativas
- Si todo falla, usa valor por defecto o variable de entorno

### 2. **Actualización Automática Diaria**
- Cron job configurado para ejecutarse diariamente a las 9:00 AM (hora UTC)
- Actualiza la cotización y recalcula precios de productos en dólares
- Se ejecuta automáticamente en Vercel

### 3. **Actualización Manual**
- Endpoint disponible para actualizar manualmente cuando sea necesario
- Recalcula todos los precios de productos en dólares

## Configuración Requerida

### 1. Variable de Entorno CRON_SECRET

Para proteger el endpoint del cron job, necesitas configurar una variable de entorno:

1. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega una nueva variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Genera un token secreto (puedes usar: `openssl rand -hex 32` o cualquier string aleatorio)
   - **Environments**: Production, Preview, Development
3. Guarda la variable

### 2. Configurar Vercel Cron

El archivo `vercel.json` ya está configurado con:
```json
{
  "crons": [
    {
      "path": "/api/cron/actualizar-cotizacion",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Esto ejecuta el cron job diariamente a las 9:00 AM UTC.

**Nota**: Vercel Cron está disponible en planes Pro y Enterprise. Si estás en el plan Hobby, el cron job no se ejecutará automáticamente, pero puedes llamar al endpoint manualmente.

## Endpoints Disponibles

### 1. Actualización Manual
**POST** `/api/cotizacion-dolar/actualizar`

Actualiza la cotización y recalcula precios manualmente.

**Ejemplo de uso:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/cotizacion-dolar/actualizar
```

**Respuesta:**
```json
{
  "success": true,
  "cotizacion": {
    "compra": 38.525,
    "venta": 39.275,
    "fecha": "2026-01-24",
    "fuente": "BROU (web oficial)"
  },
  "productosActualizados": 5,
  "mensaje": "Cotización actualizada: 38.90 UYU. 5 productos actualizados."
}
```

### 2. Cron Job Automático
**GET** `/api/cron/actualizar-cotizacion`

Este endpoint se ejecuta automáticamente via Vercel Cron. Requiere autenticación con `CRON_SECRET`.

## Cómo Funciona

### Flujo de Actualización Automática

1. **Cron Job Diario** (9:00 AM UTC):
   - Se ejecuta automáticamente
   - Obtiene la cotización actual del BROU
   - Recalcula precios de productos en dólares
   - Actualiza `precioEnPesos`, `cotizacionUsada` y `fechaCotizacion`

2. **Obtención de Cotización**:
   - Intenta obtener desde la página web del BROU
   - Si falla, intenta con API alternativa
   - Si todo falla, usa variable de entorno o valor por defecto

3. **Recálculo de Precios**:
   - Busca todos los productos con `moneda = 'USD'`
   - Calcula: `precioEnPesos = precioEnDolares * cotizacionPromedio`
   - Actualiza los campos en la base de datos

## Actualización Manual

Si necesitas actualizar la cotización manualmente (por ejemplo, si cambia durante el día):

1. Puedes llamar al endpoint `/api/cotizacion-dolar/actualizar` desde tu aplicación
2. O configurar un webhook externo que lo llame periódicamente

## Notas Importantes

### Campos de Base de Datos

**IMPORTANTE**: Los campos de moneda (`moneda`, `precioEnDolares`, `precioEnPesos`, etc.) deben existir en la base de datos para que la actualización automática funcione.

Si los campos aún no existen:
1. Ejecuta `npx prisma db push` en producción
2. O espera a que el script `vercel-build` los agregue automáticamente

### Plan de Vercel

- **Hobby**: El cron job no se ejecuta automáticamente. Puedes llamar al endpoint manualmente.
- **Pro/Enterprise**: El cron job se ejecuta automáticamente según el schedule configurado.

### Horario del Cron

El cron está configurado para las **9:00 AM UTC**. Para cambiarlo, edita `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/actualizar-cotizacion",
      "schedule": "0 9 * * *"  // Cambia esto según necesites
    }
  ]
}
```

Formato: `minuto hora día mes día-semana`
- `0 9 * * *` = 9:00 AM todos los días
- `0 12 * * *` = 12:00 PM todos los días
- `0 9 * * 1-5` = 9:00 AM de lunes a viernes

## Verificación

Para verificar que el cron job funciona:

1. Ve a **Vercel** → Tu proyecto → **Cron Jobs**
2. Deberías ver el cron job listado
3. Revisa los logs después de la hora programada

## Troubleshooting

### El cron job no se ejecuta

1. Verifica que `CRON_SECRET` esté configurado
2. Verifica que estés en un plan que soporte cron jobs (Pro/Enterprise)
3. Revisa los logs en Vercel

### Los precios no se actualizan

1. Verifica que los campos de moneda existan en la BD
2. Verifica que haya productos con `moneda = 'USD'`
3. Revisa los logs del endpoint para ver errores

### La cotización no es correcta

1. Verifica que la página del BROU esté accesible
2. Considera configurar `COTIZACION_DOLAR_BROU` como variable de entorno
3. Revisa los logs para ver qué fuente se está usando

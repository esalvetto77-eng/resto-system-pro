# Solución para Actualización de Cotización SIN Vercel Pro

## Opciones Disponibles

Si no tienes Vercel Pro, tienes **3 opciones** para actualizar la cotización automáticamente:

---

## Opción 1: Actualización Automática al Acceder (✅ Implementada)

**Cómo funciona:**
- Cuando un administrador accede al Dashboard, el sistema verifica si han pasado más de 6 horas desde la última actualización
- Si es así, actualiza la cotización automáticamente en segundo plano
- No requiere configuración adicional

**Ventajas:**
- ✅ Funciona sin Vercel Pro
- ✅ No requiere configuración
- ✅ Se actualiza automáticamente cuando usas el sistema

**Desventajas:**
- ⚠️ Solo se actualiza cuando un admin accede al dashboard
- ⚠️ Si nadie accede por más de 6 horas, no se actualiza

---

## Opción 2: Servicio de Cron Externo Gratuito (Recomendado)

Puedes usar un servicio gratuito de cron jobs que llame al endpoint cada 6-12 horas.

### Servicios Recomendados:

#### A) cron-job.org (Gratis)
1. Ve a: https://cron-job.org
2. Crea una cuenta gratuita
3. Crea un nuevo cron job:
   - **URL**: `https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar`
   - **Método**: POST
   - **Schedule**: Cada 6 horas (o 2 veces al día: 9 AM y 3 PM)
   - **Headers**: `Content-Type: application/json`

#### B) EasyCron (Gratis)
1. Ve a: https://www.easycron.com
2. Crea una cuenta gratuita
3. Configura un cron job similar

#### C) UptimeRobot (Gratis - hasta 50 monitores)
1. Ve a: https://uptimerobot.com
2. Crea un monitor HTTP(S) que llame al endpoint periódicamente

### Configuración del Endpoint para Servicios Externos

El endpoint `/api/cotizacion-dolar/actualizar` ya está listo para ser llamado externamente. Solo necesitas:

1. **Proteger el endpoint** (opcional pero recomendado):
   - Agrega una variable de entorno `COTIZACION_UPDATE_SECRET` en Vercel
   - Modifica el endpoint para verificar este secret
   - Configura el secret en el servicio de cron

---

## Opción 3: Actualización Manual

Puedes actualizar manualmente cuando lo necesites:

1. **Desde el Dashboard**: Se actualiza automáticamente cuando accedes (si han pasado más de 6 horas)
2. **Endpoint Manual**: Puedes llamar a `/api/cotizacion-dolar/actualizar` cuando quieras

---

## Recomendación

**Para mejor resultado, usa la Opción 2 (cron-job.org)**:
- Es completamente gratuito
- Se actualiza automáticamente sin depender de que alguien acceda al sistema
- Puedes configurarlo para 2 veces al día (9 AM y 3 PM)
- No requiere Vercel Pro

---

## Configuración Rápida con cron-job.org

1. Ve a: https://cron-job.org
2. Regístrate (gratis)
3. Crea nuevo cron job:
   ```
   URL: https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar
   Método: POST
   Schedule: 0 9,15 * * * (9 AM y 3 PM todos los días)
   ```
4. Guarda y activa

¡Listo! Se actualizará automáticamente 2 veces al día.

---

## Nota sobre Vercel Pro

**Vercel Pro** ($20/mes) incluye:
- Cron jobs nativos
- Más recursos
- Mejor rendimiento

Si prefieres no pagar, las opciones anteriores funcionan perfectamente.

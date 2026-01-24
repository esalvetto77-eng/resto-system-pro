# Actualización Automática de Cotización del Dólar

## Descripción

El sistema actualiza automáticamente la cotización del dólar del BROU (Banco de la República Oriental del Uruguay) **2 veces al día** y recalcula los precios en pesos uruguayos de todos los productos que están en dólares.

## Frecuencia de Actualización

- **Horarios**: 9:00 AM y 3:00 PM (hora de Uruguay)
- **Frecuencia**: Diariamente, todos los días
- **Formato cron**: `0 9,15 * * *` (9 AM y 3 PM UTC-3)

## Cómo Funciona

1. **Cron Job de Vercel**: Se ejecuta automáticamente 2 veces al día
2. **Obtención de Cotización**: 
   - Intenta obtener la cotización desde la página oficial del BROU
   - Usa "Dólar eBROU" (cotización preferencial) si está disponible
   - Si no, usa "Dólar" regular
   - Si falla, usa API alternativa (exchangerate-api.com)
   - Si todo falla, usa valor por defecto o variable de entorno
3. **Actualización de Precios**: 
   - Busca todos los productos con `moneda = 'USD'`
   - Recalcula `precioEnPesos = precioEnDolares * cotizacionPromedio`
   - Actualiza `cotizacionUsada` y `fechaCotizacion`

## Fuentes de Cotización (en orden de prioridad)

1. **BROU Web Oficial** (`brou.com.uy/cotizaciones`)
   - Prioriza "Dólar eBROU" (cotización preferencial)
   - Si no está disponible, usa "Dólar" regular
   - Valida que los valores estén en rango razonable (30-50 UYU)

2. **API Alternativa** (`exchangerate-api.com`)
   - Usa como respaldo si el BROU no está disponible
   - Aplica un spread de ±0.75 UYU

3. **Variable de Entorno** (`COTIZACION_DOLAR_BROU`)
   - Valor manual configurado en Vercel
   - Útil para testing o cuando las APIs fallan

4. **Valor por Defecto**
   - 38.9 UYU (promedio histórico)
   - Spread: ±0.75 UYU

## Configuración

### Vercel Cron Job

El cron job está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/actualizar-cotizacion",
      "schedule": "0 9,15 * * *"
    }
  ]
}
```

### Seguridad del Cron

El endpoint requiere autenticación mediante `CRON_SECRET`:

1. Ve a Vercel → Tu Proyecto → Settings → Environment Variables
2. Agrega: `CRON_SECRET` con un valor aleatorio seguro
3. El cron job enviará este token en el header `Authorization`

### Endpoint Manual

También puedes ejecutar la actualización manualmente:

```
POST /api/cotizacion-dolar/actualizar
```

Requiere autenticación de administrador.

## Verificación

Para verificar que el cron está funcionando:

1. Ve a Vercel → Tu Proyecto → Logs
2. Busca mensajes que empiecen con `[CRON COTIZACION]`
3. Deberías ver logs diarios a las 9 AM y 3 PM

## Troubleshooting

### El cron no se ejecuta

1. Verifica que `CRON_SECRET` esté configurado en Vercel
2. Verifica que el plan de Vercel soporte cron jobs (Pro plan requerido)
3. Revisa los logs de Vercel para ver errores

### La cotización no se actualiza

1. Verifica que los campos de moneda existan en la BD
2. Ejecuta `/admin/add-currency-fields` si es necesario
3. Revisa los logs del endpoint `/api/cron/actualizar-cotizacion`

### La cotización no coincide con el BROU

1. El sistema prioriza "Dólar eBROU" (cotización preferencial)
2. Si necesitas usar "Dólar" regular, puedes ajustar el código
3. Verifica que el scraping del BROU esté funcionando correctamente

## Notas Importantes

- **Plan de Vercel**: Los cron jobs requieren Vercel Pro plan
- **Zona Horaria**: Los horarios están en UTC-3 (hora de Uruguay)
- **Cache**: El sistema no usa cache para obtener siempre el valor más reciente
- **Validación**: Los valores se validan para estar en rango razonable (30-50 UYU)

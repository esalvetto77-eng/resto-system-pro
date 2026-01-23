# 🔍 Ver Logs de Vercel para Error 500

El error 500 significa que hay un problema en el servidor. Necesitamos ver el error específico en los logs de Vercel.

## Pasos para Ver los Logs

### Paso 1: Ir a Vercel Dashboard
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **resto-system-pro-9ldp**

### Paso 2: Ir a Deployments
1. En el menú lateral, haz click en **"Deployments"** (Despliegues)
2. Verás una lista de todos los deployments

### Paso 3: Abrir el Último Deployment
1. Haz click en el **último deployment** (el más reciente, arriba de la lista)
2. Se abrirá la página de detalles del deployment

### Paso 4: Ver los Logs
1. En la página del deployment, busca las pestañas arriba:
   - **"Overview"** (Vista general)
   - **"Logs"** (Registros) ← **Haz click aquí**
   - **"Functions"** (Funciones)
   - **"Build Logs"** (Logs de construcción)

2. Haz click en **"Logs"**

### Paso 5: Filtrar los Logs
1. En los logs, busca el campo de búsqueda o filtro
2. Escribe: `documentos/upload` o `Error al subir`
3. O simplemente desplázate hacia abajo buscando mensajes en rojo

### Paso 6: Intentar Subir Mientras Ves los Logs
1. **Mantén abierta la pestaña de logs de Vercel**
2. En otra pestaña, ve a tu aplicación
3. Intenta subir el documento de nuevo
4. **Inmediatamente vuelve a la pestaña de logs**
5. Deberías ver el error aparecer en tiempo real

### Paso 7: Copiar el Error
Busca mensajes que contengan:
- `[ERROR]`
- `Error al subir documento`
- `BLOB_READ_WRITE_TOKEN`
- `vercel/blob`
- Cualquier mensaje en rojo

**Copia el mensaje completo de error** que aparezca.

---

## Qué Buscar Específicamente

El error debería verse algo así:

```
[ERROR] Error al subir documento: {
  error: "...",
  ...
}
```

O:

```
Error: BLOB_READ_WRITE_TOKEN is not defined
```

O:

```
Error: Unauthorized
```

O cualquier otro mensaje de error específico.

---

## Alternativa: Ver Logs en Tiempo Real

### Opción A: Desde Functions
1. En el deployment, ve a la pestaña **"Functions"**
2. Busca la función: `/api/empleados/[id]/documentos/upload`
3. Haz click en ella
4. Verás los logs específicos de esa función

### Opción B: Desde el Dashboard Principal
1. Ve a tu proyecto en Vercel
2. En el menú lateral, haz click en **"Logs"** (no "Deployments")
3. Verás logs en tiempo real de todas las funciones
4. Filtra por: `documentos/upload`

---

## Si No Ves Logs

Si no aparecen logs recientes:

1. **Verifica que el deployment esté activo** (debe decir "Ready" o "Ready (Production)")
2. **Intenta subir el documento** mientras tienes los logs abiertos
3. **Espera unos segundos** - los logs pueden tardar en aparecer
4. **Refresca la página** de logs si no ves nada

---

## Información que Necesito

Una vez que veas el error en los logs, comparte:

1. **El mensaje de error completo** (copia todo el texto del error)
2. **La fecha y hora** del error
3. **Cualquier stack trace** (rastro de pila) que aparezca

Con esta información podré darte la solución exacta.

---

## Mientras Tanto: Verificación Rápida

Mientras revisas los logs, verifica:

- [ ] `BLOB_READ_WRITE_TOKEN` existe en Environment Variables
- [ ] El último deployment es reciente (después de configurar el token)
- [ ] El deployment está en estado "Ready"

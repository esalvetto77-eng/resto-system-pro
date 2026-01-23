# 🔍 Diagnosticar el Error Específico

El error persiste, así que necesitamos ver el error exacto que está ocurriendo.

## Paso 1: Revisar Logs de Vercel

### 1.1. Ir a los Logs
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **resto-system-pro-9ldp**
3. Ve a **"Deployments"** (Despliegues)
4. Haz click en el **último deployment** (el más reciente, arriba de la lista)

### 1.2. Ver los Logs
1. En la página del deployment, busca la pestaña **"Logs"** o **"Functions"**
2. Haz click en **"Logs"**

### 1.3. Filtrar los Logs
1. Intenta subir un documento desde la aplicación (mientras tienes los logs abiertos)
2. En los logs, busca mensajes que contengan:
   - `[ERROR]`
   - `Error al subir documento`
   - `BLOB_READ_WRITE_TOKEN`
   - `vercel/blob`

### 1.4. Copiar el Error
Copia el mensaje de error completo que aparezca. Debería verse algo como:
```
[ERROR] Error al subir documento: ...
```

---

## Paso 2: Revisar Consola del Navegador

### 2.1. Abrir DevTools
1. En tu aplicación (https://resto-system-pro-9ldp.vercel.app)
2. Presiona **F12** o haz click derecho → **"Inspeccionar"**
3. Ve a la pestaña **"Console"** (Consola)

### 2.2. Intentar Subir
1. Intenta subir un documento
2. Mira la consola para ver si hay errores en rojo

### 2.3. Revisar Network (Red)
1. En DevTools, ve a la pestaña **"Network"** (Red)
2. Intenta subir el documento de nuevo
3. Busca la request a `/api/empleados/.../documentos/upload`
4. Haz click en esa request
5. Ve a la pestaña **"Response"** (Respuesta)
6. Copia el mensaje de error que aparezca

---

## Paso 3: Verificar que el Código Esté Desplegado

### 3.1. Verificar el Último Deployment
1. En Vercel → Deployments
2. Verifica la **fecha y hora** del último deployment
3. Si es muy antiguo (antes de nuestros cambios), necesitas hacer un nuevo deploy

### 3.2. Hacer un Nuevo Deploy
Si el código no está actualizado:

**Opción A: Desde GitHub (si está conectado)**
1. Haz un pequeño cambio en cualquier archivo (o solo un espacio)
2. Haz commit y push a GitHub
3. Vercel desplegará automáticamente

**Opción B: Redeploy Manual**
1. Vercel → Deployments → Último deployment
2. Click en los 3 puntos → **"Redeploy"**
3. Espera a que termine

---

## Errores Comunes y Soluciones

### Error: "BLOB_READ_WRITE_TOKEN is not defined"
**Solución**: 
- Verifica que la variable existe en Environment Variables
- Verifica que está en Production, Preview y Development
- Haz un redeploy después de verificar

### Error: "Unauthorized" o "401"
**Solución**:
- El token puede ser inválido
- Regenera el token en Storage → Blob Store → Settings → Tokens
- Actualiza la variable de entorno con el nuevo token
- Redeploy

### Error: "File too large"
**Solución**:
- El archivo excede 10MB
- Usa un archivo más pequeño

### Error: "Tipo de archivo no permitido"
**Solución**:
- Solo se permiten: PDF, JPG, JPEG, PNG, GIF, WEBP
- Verifica la extensión del archivo

### Error: "Magic bytes no válidos"
**Solución**:
- El archivo puede estar corrupto
- Intenta con otro archivo del mismo tipo

---

## Información que Necesito

Para ayudarte mejor, comparte:

1. **El mensaje de error exacto** de los logs de Vercel
2. **El mensaje de error** de la consola del navegador (F12)
3. **La respuesta** de la request en Network (F12 → Network)
4. **La fecha del último deployment** en Vercel

Con esta información podré darte una solución específica.

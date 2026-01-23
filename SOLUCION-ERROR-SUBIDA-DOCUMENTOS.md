# 🔧 Solución: Error al Subir Documentos

## Problema

El error "Error al subir el documento" persiste después de implementar Vercel Blob Storage.

## Posibles Causas y Soluciones

### 1. ⚠️ BLOB_READ_WRITE_TOKEN No Configurado (MÁS PROBABLE)

**Síntoma**: Error genérico sin detalles específicos.

**Solución**:

1. **Ve a Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a Storage** (menú lateral)
4. **Crea un Blob Store** (si no existe):
   - Click en "Create Database" o "Add Storage"
   - Selecciona "Blob"
   - Dale un nombre (ej: `documentos-empleados`)
   - Click en "Create"
5. **Verifica la variable de entorno**:
   - Ve a **Settings** → **Environment Variables**
   - Busca `BLOB_READ_WRITE_TOKEN`
   - Si **NO existe**, créala:
     - **Name**: `BLOB_READ_WRITE_TOKEN`
     - **Value**: Copia desde **Storage** → Tu Blob Store → **Settings** → **Tokens**
     - **Environments**: Production, Preview, Development
6. **Haz un Redeploy**:
   - Ve a **Deployments**
   - Click en los 3 puntos del último deployment
   - Selecciona **Redeploy**

---

### 2. 🔍 Verificar Logs de Vercel

**Para diagnosticar el problema exacto**:

1. **Ve a Vercel Dashboard** → Tu proyecto → **Deployments**
2. **Click en el último deployment**
3. **Ve a la pestaña "Logs"** o "Functions"
4. **Busca errores relacionados con**:
   - `BLOB_READ_WRITE_TOKEN`
   - `Error al subir documento`
   - `[ERROR] Error al subir a Vercel Blob`

**Ejemplos de errores comunes**:

```
[ERROR] BLOB_READ_WRITE_TOKEN no está configurado
```
→ **Solución**: Configurar el token (ver paso 1)

```
Error: Unauthorized
```
→ **Solución**: El token es inválido o expiró. Regenerar token.

```
Error: File too large
```
→ **Solución**: El archivo excede el límite (actualmente 10MB)

---

### 3. ✅ Validación de Magic Bytes Falla

**Síntoma**: El archivo es válido pero se rechaza por "firma no válida".

**Solución temporal** (solo para testing):

Si necesitas subir un archivo específico que está siendo rechazado incorrectamente, puedes verificar los logs para ver qué bytes tiene el archivo.

**Solución permanente**: El código ya incluye logging detallado. Revisa los logs de Vercel para ver qué bytes tiene el archivo y ajustar las firmas si es necesario.

---

### 4. 🔐 Problema de Autenticación

**Síntoma**: Error 401 "No autorizado".

**Solución**:
- Asegúrate de estar logueado en la aplicación
- Verifica que tu sesión no haya expirado
- Intenta cerrar sesión y volver a iniciar sesión

---

### 5. 📏 Archivo Demasiado Grande

**Síntoma**: Error específico sobre tamaño.

**Solución**:
- El límite actual es **10MB**
- Comprime el archivo o usa uno más pequeño
- Si necesitas aumentar el límite, edita `MAX_FILE_SIZE` en el código

---

## Pasos de Diagnóstico Rápido

### Paso 1: Verificar Token en Vercel

```bash
# En Vercel Dashboard:
1. Settings → Environment Variables
2. Buscar: BLOB_READ_WRITE_TOKEN
3. Si NO existe → Crear (ver paso 1 arriba)
```

### Paso 2: Verificar Logs

```bash
# En Vercel Dashboard:
1. Deployments → Último deployment
2. Logs o Functions
3. Buscar errores relacionados con "blob" o "documento"
```

### Paso 3: Probar con Archivo Pequeño

1. Intenta subir un archivo pequeño (menos de 1MB)
2. Si funciona → El problema es el tamaño
3. Si no funciona → El problema es la configuración

### Paso 4: Verificar en Consola del Navegador

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Intenta subir un archivo
4. Busca la request a `/api/empleados/.../documentos/upload`
5. Revisa la **Response** para ver el error específico

---

## Mensajes de Error Mejorados

El código ahora incluye mensajes de error más específicos:

- ✅ **"Error de configuración del servidor"** → Token no configurado
- ✅ **"Error de autenticación con el servicio de almacenamiento"** → Token inválido
- ✅ **"El archivo es demasiado grande"** → Excede 10MB
- ✅ **"El archivo no coincide con su extensión"** → Magic bytes no válidos
- ✅ **"Tipo de archivo no permitido"** → Extensión no permitida

---

## Verificación Final

Después de configurar todo, verifica:

- [ ] `BLOB_READ_WRITE_TOKEN` existe en Vercel Environment Variables
- [ ] Blob Store está creado en Vercel
- [ ] Se hizo un redeploy después de configurar el token
- [ ] El archivo es menor a 10MB
- [ ] El archivo tiene una extensión permitida (PDF, JPG, PNG, GIF, WEBP)
- [ ] Estás logueado en la aplicación

---

## Si el Problema Persiste

1. **Revisa los logs de Vercel** para el error exacto
2. **Verifica la consola del navegador** (F12 → Network)
3. **Prueba con un archivo diferente** (más pequeño, diferente formato)
4. **Contacta al administrador** con los logs específicos

---

## Código de Diagnóstico

El código ahora incluye logging detallado. Busca en los logs de Vercel:

- `[ERROR]` - Errores críticos
- `[SEGURIDAD]` - Operaciones de seguridad
- `[VALIDACIÓN]` - Problemas de validación
- `[ADVERTENCIA]` - Advertencias no críticas

Estos logs te ayudarán a identificar exactamente dónde está fallando el proceso.

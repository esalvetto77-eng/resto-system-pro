# ✅ Verificación Rápida: Configuración de Vercel Blob Storage

## 🔍 Paso a Paso para Verificar y Configurar

### PASO 1: Verificar si Blob Store Existe

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **resto-system-pro-9ldp**
3. En el menú lateral, busca **"Storage"**
4. Si NO ves "Storage" o está vacío:
   - ⚠️ **Necesitas crear el Blob Store** (ver PASO 2)
5. Si SÍ ves un Blob Store:
   - ✅ Continúa al PASO 3

---

### PASO 2: Crear Blob Store (Si No Existe)

1. En Vercel Dashboard → Tu proyecto
2. Click en **"Storage"** (o **"Add Storage"**)
3. Click en **"Create Database"** o **"Create Storage"**
4. Selecciona **"Blob"**
5. Dale un nombre (ej: `documentos-empleados` o `blob-store`)
6. Click en **"Create"**
7. ⏳ Espera a que se cree (puede tardar unos segundos)

---

### PASO 3: Verificar Variable de Entorno BLOB_READ_WRITE_TOKEN

1. En Vercel Dashboard → Tu proyecto
2. Ve a **"Settings"** (Configuración)
3. Click en **"Environment Variables"** (Variables de Entorno)
4. Busca en la lista: **`BLOB_READ_WRITE_TOKEN`**

#### Si NO Existe:

1. Click en **"Add New"** o **"Add"**
2. **Name (Nombre)**: `BLOB_READ_WRITE_TOKEN`
3. **Value (Valor)**: 
   - Ve a **Storage** → Tu Blob Store → **Settings** → **Tokens**
   - Copia el token que aparece ahí
   - Pégalo en el campo "Value"
4. **Environments**: Selecciona TODOS:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click en **"Save"**

#### Si SÍ Existe:

1. Verifica que el valor NO esté vacío
2. Verifica que esté en los 3 environments (Production, Preview, Development)
3. Si falta en alguno, agrégalo

---

### PASO 4: Hacer Redeploy

**IMPORTANTE**: Después de configurar el token, DEBES hacer un redeploy.

#### Opción A: Redeploy Manual

1. Ve a **"Deployments"** (Despliegues)
2. Busca el último deployment
3. Click en los **3 puntos** (⋯) a la derecha
4. Selecciona **"Redeploy"**
5. Confirma el redeploy
6. ⏳ Espera a que termine (puede tardar 2-5 minutos)

#### Opción B: Redeploy Automático (Push a GitHub)

Si tu proyecto está conectado a GitHub:
1. Haz un commit pequeño (puede ser solo un espacio en blanco)
2. Push a GitHub
3. Vercel desplegará automáticamente

---

### PASO 5: Verificar que Funciona

1. Ve a tu aplicación: https://resto-system-pro-9ldp.vercel.app
2. Inicia sesión
3. Ve a **Empleados** → Selecciona un empleado
4. Intenta subir un documento
5. Si funciona: ✅ **¡Listo!**
6. Si NO funciona: Ver PASO 6

---

### PASO 6: Diagnosticar el Error Específico

Ahora el sistema mostrará mensajes de error más específicos. Revisa:

#### A) En el Navegador (Alerta)

El mensaje de error ahora será más específico:
- ❌ **"Error de configuración: BLOB_READ_WRITE_TOKEN no está configurado"**
  → Ve al PASO 3 y configura el token

- ❌ **"Error de autenticación con el servicio de almacenamiento"**
  → El token es inválido. Regenera el token en Storage → Settings → Tokens

- ❌ **"El archivo es demasiado grande"**
  → El archivo excede 10MB. Usa uno más pequeño.

- ❌ **"Tipo de archivo no permitido"**
  → Solo se permiten: PDF, JPG, JPEG, PNG, GIF, WEBP

#### B) En la Consola del Navegador (F12)

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Console**
3. Intenta subir el archivo
4. Busca mensajes que empiecen con `[ERROR]` o `Error:`

#### C) En los Logs de Vercel

1. Ve a Vercel Dashboard → Tu proyecto → **Deployments**
2. Click en el último deployment
3. Ve a **"Logs"** o **"Functions"**
4. Busca errores relacionados con:
   - `BLOB_READ_WRITE_TOKEN`
   - `Error al subir documento`
   - `[ERROR] Error al subir a Vercel Blob`

---

## 🔧 Solución Rápida si el Token No Funciona

Si el token no funciona después de configurarlo:

1. **Regenera el Token**:
   - Ve a **Storage** → Tu Blob Store → **Settings** → **Tokens**
   - Click en **"Regenerate"** o **"Create New Token"**
   - Copia el nuevo token

2. **Actualiza la Variable de Entorno**:
   - Ve a **Settings** → **Environment Variables**
   - Busca `BLOB_READ_WRITE_TOKEN`
   - Click en **"Edit"**
   - Pega el nuevo token
   - **Save**

3. **Haz un Redeploy** (ver PASO 4)

---

## ✅ Checklist Final

Antes de intentar subir un documento, verifica:

- [ ] Blob Store está creado en Vercel
- [ ] `BLOB_READ_WRITE_TOKEN` existe en Environment Variables
- [ ] El token tiene valor (no está vacío)
- [ ] El token está en Production, Preview y Development
- [ ] Se hizo un redeploy después de configurar el token
- [ ] El archivo es menor a 10MB
- [ ] El archivo tiene extensión permitida (PDF, JPG, PNG, GIF, WEBP)
- [ ] Estás logueado en la aplicación

---

## 📞 Si Nada Funciona

Si después de seguir todos los pasos el error persiste:

1. **Copia el mensaje de error exacto** que aparece en el navegador
2. **Revisa los logs de Vercel** y copia cualquier error relacionado
3. **Verifica en la consola del navegador** (F12 → Console) si hay errores
4. **Comparte esta información** para diagnóstico más específico

---

## 🎯 Resumen Rápido

**El problema más común es que falta `BLOB_READ_WRITE_TOKEN` en Vercel.**

**Solución rápida:**
1. Vercel → Storage → Crear Blob Store
2. Vercel → Settings → Environment Variables → Agregar `BLOB_READ_WRITE_TOKEN`
3. Redeploy
4. Probar de nuevo

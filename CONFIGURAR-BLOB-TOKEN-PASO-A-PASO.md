# 📋 Configurar BLOB_READ_WRITE_TOKEN en Vercel - Paso a Paso

## 🎯 Objetivo
Configurar el token de Vercel Blob Storage para que la subida de documentos funcione.

---

## PASO 1: Crear Blob Store en Vercel

### 1.1. Ir a Vercel Dashboard
1. Abre tu navegador
2. Ve a: **https://vercel.com/dashboard**
3. **Inicia sesión** si no lo has hecho

### 1.2. Seleccionar tu Proyecto
1. En la lista de proyectos, busca y haz click en: **resto-system-pro-9ldp**
   - (O el nombre que tenga tu proyecto)

### 1.3. Ir a Storage
1. En el menú lateral izquierdo, busca la opción **"Storage"**
2. Si NO ves "Storage", busca **"Add Storage"** o **"Create Database"**
3. Haz click en **"Storage"**

### 1.4. Crear Blob Store
1. Si ves una pantalla vacía o un botón que dice **"Create Database"** o **"Create Storage"**, haz click
2. Se abrirá un menú con opciones. Selecciona **"Blob"**
3. Aparecerá un formulario. Completa:
   - **Name (Nombre)**: Escribe `documentos-empleados` (o cualquier nombre que prefieras)
   - **Region (Región)**: Deja la que esté seleccionada por defecto
4. Haz click en el botón **"Create"** o **"Crear"**
5. ⏳ **Espera** unos segundos mientras se crea (verás un indicador de carga)

✅ **Verificación**: Deberías ver tu Blob Store creado en la lista

---

## PASO 2: Obtener el Token

### 2.1. Abrir Configuración del Blob Store
1. En la lista de Storage, haz click en el Blob Store que acabas de crear
   - (Debería aparecer con el nombre que le diste, ej: `documentos-empleados`)

### 2.2. Ir a Settings (Configuración)
1. En la parte superior de la pantalla, busca la pestaña **"Settings"** o **"Configuración"**
2. Haz click en **"Settings"**

### 2.3. Ir a Tokens
1. En el menú de Settings, busca la sección **"Tokens"** o **"API Tokens"**
2. Haz click en **"Tokens"**

### 2.4. Ver/Crear Token
1. Verás una lista de tokens (puede estar vacía)
2. Si hay tokens, busca uno que diga **"Read and Write"** o similar
3. Si NO hay tokens o quieres crear uno nuevo:
   - Haz click en **"Create Token"** o **"New Token"** o **"Add Token"**
   - Dale un nombre (ej: `documentos-token`)
   - Selecciona permisos: **"Read and Write"** o **"Full Access"**
   - Haz click en **"Create"** o **"Generate"**

### 2.5. Copiar el Token
1. Verás el token (una cadena larga de texto, algo como: `vercel_blob_xxxxx_xxxxx`)
2. **IMPORTANTE**: Haz click en el botón **"Copy"** o **"Copiar"** al lado del token
   - ⚠️ **NO** intentes copiarlo manualmente, usa el botón de copiar
3. O haz click derecho sobre el token y selecciona **"Copy"**
4. ✅ **Verificación**: El token debería estar copiado en tu portapapeles

---

## PASO 3: Agregar Token como Variable de Entorno

### 3.1. Ir a Settings del Proyecto
1. En el menú lateral izquierdo, haz click en **"Settings"** (Configuración)
2. Asegúrate de estar en la sección de tu proyecto (no en Storage)

### 3.2. Ir a Environment Variables
1. En el menú de Settings, busca y haz click en **"Environment Variables"** (Variables de Entorno)
   - Puede estar en una subsección llamada **"General"** o directamente visible

### 3.3. Agregar Nueva Variable
1. Busca el botón **"Add New"** o **"Add"** o **"Create"** o **"Nueva Variable"**
2. Haz click en ese botón

### 3.4. Completar el Formulario
1. En el campo **"Name"** o **"Nombre"**, escribe exactamente:
   ```
   BLOB_READ_WRITE_TOKEN
   ```
   - ⚠️ **IMPORTANTE**: Debe ser exactamente así, con mayúsculas y guiones bajos

2. En el campo **"Value"** o **"Valor"**, pega el token que copiaste en el PASO 2.5
   - Haz click derecho → **"Paste"** o presiona **Ctrl+V** (Windows) / **Cmd+V** (Mac)

3. En la sección **"Environments"** o **"Entornos"**, selecciona **TODOS**:
   - ✅ **Production** (Producción)
   - ✅ **Preview** (Vista previa)
   - ✅ **Development** (Desarrollo)
   - Haz click en cada uno para marcarlos

### 3.5. Guardar
1. Haz click en el botón **"Save"** o **"Guardar"**
2. ✅ **Verificación**: Deberías ver `BLOB_READ_WRITE_TOKEN` en la lista de variables de entorno

---

## PASO 4: Hacer Redeploy

### 4.1. Ir a Deployments
1. En el menú lateral izquierdo, haz click en **"Deployments"** (Despliegues)

### 4.2. Seleccionar el Último Deployment
1. Verás una lista de deployments (despliegues)
2. El más reciente debería estar arriba
3. Haz click en los **3 puntos** (⋯) o en el menú de opciones a la derecha del último deployment

### 4.3. Redeploy
1. En el menú que se abre, busca y haz click en **"Redeploy"** o **"Redesplegar"**
2. Se abrirá un diálogo de confirmación
3. Haz click en **"Redeploy"** o **"Confirmar"** para confirmar
4. ⏳ **Espera** 2-5 minutos mientras se redespliega
   - Verás un indicador de progreso
   - El estado cambiará a "Building" y luego a "Ready"

✅ **Verificación**: El deployment debería completarse exitosamente

---

## PASO 5: Probar la Subida de Documentos

### 5.1. Ir a tu Aplicación
1. Abre una nueva pestaña en tu navegador
2. Ve a: **https://resto-system-pro-9ldp.vercel.app**
3. **Inicia sesión** si no lo has hecho

### 5.2. Ir a Empleados
1. En el menú lateral, haz click en **"Empleados"**
2. Selecciona cualquier empleado de la lista (haz click en su nombre)

### 5.3. Intentar Subir un Documento
1. En la sección **"Documentos Adjuntos"**, haz click en el botón **"+ Agregar Documento"**
2. Completa el formulario:
   - **Nombre del Documento**: Escribe un nombre (ej: "Test")
   - **Archivo**: Haz click en **"Choose File"** y selecciona un archivo pequeño (menos de 10MB)
     - Formatos permitidos: PDF, JPG, PNG, GIF, WEBP
3. Haz click en **"Subir Documento"**

### 5.4. Verificar Resultado
- ✅ **Si funciona**: Verás el documento en la lista y un mensaje de éxito
- ❌ **Si falla**: Verás un mensaje de error específico que te dirá qué está mal

---

## 🔍 Verificación Final

Antes de probar, verifica que todo esté configurado:

- [ ] Blob Store creado en Vercel Storage
- [ ] Token copiado desde Storage → Settings → Tokens
- [ ] Variable `BLOB_READ_WRITE_TOKEN` creada en Settings → Environment Variables
- [ ] El token tiene un valor (no está vacío)
- [ ] La variable está en Production, Preview y Development
- [ ] Se hizo un redeploy después de configurar

---

## ❌ Si Algo Sale Mal

### Problema: No veo "Storage" en el menú
**Solución**: 
- Puede estar en una versión diferente de Vercel
- Busca "Add Storage" o "Create Database" en lugar de "Storage"
- O ve directamente a: `https://vercel.com/[tu-usuario]/[tu-proyecto]/storage`

### Problema: No puedo crear un Blob Store
**Solución**:
- Verifica que tengas permisos de administrador en el proyecto
- Si estás en un plan gratuito, verifica los límites
- Intenta refrescar la página

### Problema: No veo "Tokens" en Settings del Blob Store
**Solución**:
- El token puede generarse automáticamente
- Busca en la página principal del Blob Store
- O busca "API Keys" o "Access Keys"

### Problema: El token no funciona después de configurarlo
**Solución**:
1. Verifica que copiaste el token completo (debe ser muy largo)
2. Verifica que no hay espacios al inicio o final
3. Regenera el token y vuelve a configurarlo
4. Asegúrate de hacer un redeploy después de cambiar el token

### Problema: Sigue dando error después de todo
**Solución**:
1. Espera 5-10 minutos después del redeploy (a veces tarda en propagarse)
2. Cierra sesión y vuelve a iniciar sesión en la aplicación
3. Limpia la caché del navegador (Ctrl+Shift+Delete)
4. Intenta en modo incógnito

---

## 📞 Resumen Rápido

1. **Vercel Dashboard** → Tu proyecto → **Storage** → **Create Blob Store**
2. **Storage** → Tu Blob Store → **Settings** → **Tokens** → **Copiar token**
3. **Settings** → **Environment Variables** → **Add New** → `BLOB_READ_WRITE_TOKEN` → **Pegar token** → **Save**
4. **Deployments** → **Redeploy**
5. **Probar** subir un documento

---

## ✅ Listo

Una vez completados todos los pasos, la subida de documentos debería funcionar correctamente. Si tienes algún problema en algún paso específico, avísame y te ayudo.

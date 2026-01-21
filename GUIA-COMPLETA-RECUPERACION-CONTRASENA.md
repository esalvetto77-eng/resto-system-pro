# 📋 Guía Completa: Implementar Recuperación de Contraseña

## ✅ Estado Actual

- ✅ Código implementado y desplegado
- ✅ Tabla de base de datos creada
- ✅ Páginas UI creadas (`/forgot-password` y `/reset-password`)
- ⏳ **Falta configurar variables de entorno en Vercel**

---

## 🎯 Pasos a Seguir (En Orden)

### **PASO 1: Obtener Contraseña de Aplicación de Gmail**

#### 1.1. Activar Verificación en 2 Pasos (si no lo tienes)

1. Ve a: https://myaccount.google.com/
2. Click en **"Seguridad"** (menú lateral izquierdo)
3. Busca **"Verificación en 2 pasos"**
4. Si NO está activado:
   - Click en **"Activar"**
   - Sigue las instrucciones para activar 2FA
   - Necesitarás tu teléfono para recibir códigos
5. Si YA está activado, continúa al siguiente paso

#### 1.2. Generar Contraseña de Aplicación

1. En la misma página de **"Seguridad"**, baja hasta encontrar **"Contraseñas de aplicaciones"**
   - Si no la ves, busca en **"Cómo iniciar sesión en Google"** → **"Contraseñas de aplicaciones"**
2. Click en **"Contraseñas de aplicaciones"**
3. Si te pide verificar tu identidad, hazlo
4. En **"Seleccionar app"**, elige: **"Correo"**
5. En **"Seleccionar dispositivo"**, elige: **"Otro (nombre personalizado)"**
6. Escribe: **"Sistema de Gestión Restaurantes"**
7. Click en **"Generar"**
8. **IMPORTANTE**: Se mostrará una contraseña de 16 caracteres
   - Ejemplo: `abcd efgh ijkl mnop`
   - **CÓPIALA AHORA** (solo se muestra una vez)
   - Guárdala en un lugar seguro (notas, gestor de contraseñas, etc.)

---

### **PASO 2: Configurar Variables de Entorno en Vercel**

#### 2.1. Ir a Vercel

1. Abre tu navegador
2. Ve a: https://vercel.com/
3. Inicia sesión si es necesario
4. Ve a tu proyecto: **"resto-system-pro-9ldp"** (o el nombre que tenga)

#### 2.2. Agregar Variable: EMAIL_USER

1. En el menú lateral, click en **"Settings"**
2. Click en **"Environment Variables"** (en el submenú)
3. Click en el botón **"Add"** o **"Create new"** (arriba a la derecha)
4. En el campo **"Key"**, escribe exactamente: `EMAIL_USER`
5. En el campo **"Value"**, escribe tu email de Gmail completo:
   - Ejemplo: `tucorreo@gmail.com`
6. En **"Environments"**, selecciona: **"All Environments"** (Production, Preview, Development)
7. Click en **"Save"**

#### 2.3. Agregar Variable: EMAIL_PASSWORD

1. Click en **"Add"** o **"Create new"** nuevamente
2. En el campo **"Key"**, escribe exactamente: `EMAIL_PASSWORD`
3. En el campo **"Value"**, pega la **contraseña de aplicación de 16 caracteres** que copiaste en el Paso 1
   - **IMPORTANTE**: Pega la contraseña SIN espacios
   - Ejemplo: `abcdefghijklmnop` (no `abcd efgh ijkl mnop`)
4. En **"Environments"**, selecciona: **"All Environments"**
5. Click en **"Save"**

#### 2.4. Agregar Variable: EMAIL_FROM (Opcional pero Recomendado)

1. Click en **"Add"** o **"Create new"** nuevamente
2. En el campo **"Key"**, escribe exactamente: `EMAIL_FROM`
3. En el campo **"Value"**, escribe:
   ```
   "Sistema de Gestión" <tucorreo@gmail.com>
   ```
   (Reemplaza `tucorreo@gmail.com` con tu email real)
4. En **"Environments"**, selecciona: **"All Environments"**
5. Click en **"Save"**

#### 2.5. Agregar Variable: NEXT_PUBLIC_APP_URL (Recomendado)

1. Click en **"Add"** o **"Create new"** nuevamente
2. En el campo **"Key"**, escribe exactamente: `NEXT_PUBLIC_APP_URL`
3. En el campo **"Value"**, escribe la URL completa de tu aplicación:
   - Ejemplo: `https://resto-system-pro-9ldp.vercel.app`
   - (Reemplaza con la URL real de tu app en Vercel)
4. En **"Environments"**, selecciona: **"All Environments"**
5. Click en **"Save"**

#### 2.6. Agregar Variable: ALLOWED_PASSWORD_RECOVERY_EMAILS (CRÍTICO)

1. Click en **"Add"** o **"Create new"** nuevamente
2. En el campo **"Key"**, escribe exactamente: `ALLOWED_PASSWORD_RECOVERY_EMAILS`
3. En el campo **"Value"**, escribe SOLO tu email (el que quieres que pueda recuperar contraseñas):
   - Ejemplo: `dueno@resto.com`
   - Si quieres permitir múltiples emails, sepáralos por comas: `dueno@resto.com,admin@resto.com`
4. En **"Environments"**, selecciona: **"All Environments"**
5. Click en **"Save"**

---

### **PASO 3: Verificar Variables Configuradas**

En la lista de Environment Variables, deberías ver:

- ✅ `EMAIL_USER`
- ✅ `EMAIL_PASSWORD`
- ✅ `EMAIL_FROM` (opcional)
- ✅ `NEXT_PUBLIC_APP_URL` (opcional pero recomendado)
- ✅ `ALLOWED_PASSWORD_RECOVERY_EMAILS` (CRÍTICO)

---

### **PASO 4: Hacer Redeploy en Vercel**

#### 4.1. Opción 1: Redeploy Manual (Recomendado)

1. En Vercel, ve a **"Deployments"** (menú lateral)
2. Busca el último deployment (el más reciente)
3. Click en los **tres puntos** (⋯) a la derecha del deployment
4. Click en **"Redeploy"**
5. Confirma el redeploy
6. Espera a que termine (1-2 minutos)

#### 4.2. Opción 2: Esperar Deploy Automático

- Si haces un commit nuevo, Vercel desplegará automáticamente
- Pero es mejor hacer un redeploy manual para asegurar que tome las nuevas variables

---

### **PASO 5: Probar la Recuperación de Contraseña**

#### 5.1. Probar con Email Autorizado

1. Ve a tu aplicación en Vercel: `https://resto-system-pro-9ldp.vercel.app` (o tu URL)
2. Click en **"Iniciar Sesión"** (si no estás en login)
3. Click en **"¿Olvidaste tu contraseña?"** (debajo del botón de login)
4. Ingresa tu email autorizado (el que configuraste en `ALLOWED_PASSWORD_RECOVERY_EMAILS`)
5. Click en **"Enviar Enlace de Recuperación"**
6. Deberías ver un mensaje: "Si el email existe, recibirás un enlace..."
7. **Revisa tu email** (y la carpeta de Spam si no lo ves)
8. Click en el **enlace del email**
9. Ingresa una **nueva contraseña** (mínimo 12 caracteres, con letras y números)
10. Confirma la contraseña
11. Click en **"Restablecer Contraseña"**
12. Deberías ver: "Contraseña restablecida exitosamente"
13. Serás redirigido al login
14. **Prueba iniciar sesión** con la nueva contraseña

#### 5.2. Verificar que Email NO Autorizado NO Funciona

1. Ve a `/forgot-password`
2. Ingresa un email que **NO** esté en `ALLOWED_PASSWORD_RECOVERY_EMAILS`
   - Ejemplo: `encargado@resto.com` (si solo configuraste `dueno@resto.com`)
3. Click en **"Enviar Enlace de Recuperación"**
4. Verás el mismo mensaje genérico (correcto, no revela que fue rechazado)
5. **NO deberías recibir email** (correcto)
6. Esto confirma que la restricción funciona

---

## ✅ Checklist Final

Marca cada paso cuando lo completes:

- [ ] **Paso 1**: Contraseña de aplicación de Gmail obtenida
- [ ] **Paso 2.1**: `EMAIL_USER` configurado en Vercel
- [ ] **Paso 2.2**: `EMAIL_PASSWORD` configurado en Vercel
- [ ] **Paso 2.3**: `EMAIL_FROM` configurado en Vercel (opcional)
- [ ] **Paso 2.4**: `NEXT_PUBLIC_APP_URL` configurado en Vercel (opcional)
- [ ] **Paso 2.5**: `ALLOWED_PASSWORD_RECOVERY_EMAILS` configurado en Vercel (CRÍTICO)
- [ ] **Paso 3**: Todas las variables verificadas
- [ ] **Paso 4**: Redeploy realizado
- [ ] **Paso 5.1**: Prueba con email autorizado exitosa
- [ ] **Paso 5.2**: Verificado que email NO autorizado NO funciona

---

## 🆘 Si Algo No Funciona

### Email no llega:
- ✅ Revisa la carpeta de **Spam**
- ✅ Verifica que `EMAIL_USER` y `EMAIL_PASSWORD` estén correctos
- ✅ Verifica que usaste la **contraseña de aplicación**, no tu contraseña normal
- ✅ Revisa los **Logs de Vercel** para ver errores

### Error: "Invalid login" en logs:
- ✅ Asegúrate de usar la **contraseña de aplicación de 16 caracteres**
- ✅ Sin espacios en la contraseña

### Email autorizado no funciona:
- ✅ Verifica que `ALLOWED_PASSWORD_RECOVERY_EMAILS` tenga exactamente tu email
- ✅ En minúsculas
- ✅ Sin espacios extra

### Token expirado:
- ✅ Los tokens expiran en 1 hora
- ✅ Solicita un nuevo enlace

---

## 📝 Resumen de Variables

| Variable | Valor de Ejemplo | Requerido |
|----------|------------------|-----------|
| `EMAIL_USER` | `tucorreo@gmail.com` | ✅ Sí |
| `EMAIL_PASSWORD` | `abcdefghijklmnop` | ✅ Sí |
| `EMAIL_FROM` | `"Sistema de Gestión" <tucorreo@gmail.com>` | ⚠️ Opcional |
| `NEXT_PUBLIC_APP_URL` | `https://resto-system-pro-9ldp.vercel.app` | ⚠️ Recomendado |
| `ALLOWED_PASSWORD_RECOVERY_EMAILS` | `dueno@resto.com` | ✅ **CRÍTICO** |

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, la recuperación de contraseña estará **100% funcional y segura**, permitiendo solo a tu email autorizado recuperar contraseñas.

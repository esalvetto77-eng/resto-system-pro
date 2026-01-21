# 📧 Configurar Gmail para Recuperación de Contraseña

## Paso 1: Obtener Contraseña de Aplicación de Gmail

Gmail requiere una **"Contraseña de Aplicación"** (App Password) en lugar de tu contraseña normal para enviar emails desde aplicaciones.

### Instrucciones:

1. **Ve a tu cuenta de Google**: https://myaccount.google.com/
2. **Seguridad** → **Verificación en 2 pasos**
   - Si no tienes 2FA activado, necesitarás activarlo primero
3. **Busca "Contraseñas de aplicaciones"** (al final de la página)
4. **Selecciona la app**: "Correo"
5. **Selecciona el dispositivo**: "Otro (nombre personalizado)"
   - Escribe: "Sistema de Gestión Restaurantes"
6. **Click en "Generar"**
7. **Copia la contraseña de 16 caracteres** que aparece
   - Se verá algo como: `abcd efgh ijkl mnop`
   - **IMPORTANTE**: Esta contraseña solo se muestra una vez. Guárdala bien.

---

## Paso 2: Configurar Variables de Entorno en Vercel

Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables** y agrega:

### Variables Requeridas:

1. **`EMAIL_USER`**
   - **Value**: Tu email de Gmail completo
   - **Ejemplo**: `tucorreo@gmail.com`
   - **Environments**: All Environments

2. **`EMAIL_PASSWORD`**
   - **Value**: La contraseña de aplicación de 16 caracteres (sin espacios)
   - **Ejemplo**: `abcdefghijklmnop`
   - **Environments**: All Environments
   - ⚠️ **IMPORTANTE**: Usa la contraseña de aplicación, NO tu contraseña normal de Gmail

3. **`EMAIL_FROM`** (Opcional)
   - **Value**: Nombre y email para mostrar en "De:"
   - **Ejemplo**: `"Sistema de Gestión" <tucorreo@gmail.com>`
   - Si no se configura, usará `EMAIL_USER`
   - **Environments**: All Environments

### Variables Opcionales (si usas otro servidor SMTP):

- **`EMAIL_HOST`**: Por defecto `smtp.gmail.com`
- **`EMAIL_PORT`**: Por defecto `587` (TLS) o `465` (SSL)
- **`EMAIL_SECURE`**: `true` para puerto 465, `false` para 587

---

## Paso 3: Configurar URL de la Aplicación

Agrega también:

**`NEXT_PUBLIC_APP_URL`** (Opcional pero recomendado)
- **Value**: URL completa de tu aplicación en Vercel
- **Ejemplo**: `https://resto-system-pro-9ldp.vercel.app`
- **Environments**: All Environments

Si no se configura, el sistema intentará detectarla automáticamente desde `VERCEL_URL`.

---

## Paso 4: Verificar Configuración

Después de configurar las variables:

1. **Haz un Redeploy** en Vercel
2. **Prueba la recuperación de contraseña**:
   - Ve a `/forgot-password`
   - Ingresa un email válido
   - Revisa tu bandeja de entrada (y spam)

---

## 🔒 Seguridad

### ✅ Hacer:
- ✅ Usar **Contraseña de Aplicación** (no tu contraseña normal)
- ✅ Guardar la contraseña de aplicación de forma segura
- ✅ No compartir las credenciales públicamente

### ❌ No Hacer:
- ❌ No usar tu contraseña normal de Gmail
- ❌ No commitear las credenciales en Git
- ❌ No compartir las variables de entorno

---

## 🆘 Solución de Problemas

### Error: "Invalid login"
- Verifica que estés usando la **Contraseña de Aplicación**, no tu contraseña normal
- Asegúrate de que la contraseña no tenga espacios

### Error: "Less secure app access"
- Gmail ya no permite "aplicaciones menos seguras"
- **Solución**: Usa Contraseña de Aplicación (requiere 2FA activado)

### Email no llega:
- Revisa la carpeta de **Spam**
- Verifica que el email esté correcto en `EMAIL_USER`
- Revisa los logs de Vercel para ver errores

### Token expirado:
- Los tokens expiran en **1 hora**
- Solicita un nuevo enlace desde `/forgot-password`

---

## ✅ Checklist

- [ ] 2FA activado en Google
- [ ] Contraseña de aplicación generada
- [ ] `EMAIL_USER` configurado en Vercel
- [ ] `EMAIL_PASSWORD` configurado en Vercel (contraseña de aplicación)
- [ ] `EMAIL_FROM` configurado (opcional)
- [ ] `NEXT_PUBLIC_APP_URL` configurado (opcional pero recomendado)
- [ ] Redeploy realizado
- [ ] Prueba de recuperación exitosa

---

## 📝 Notas

- Los tokens de recuperación expiran en **1 hora**
- Solo se puede usar **una vez** cada token
- Rate limiting: máximo **3 solicitudes por IP cada hora**
- Los emails se envían desde tu cuenta de Gmail

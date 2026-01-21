# 🔐 Activar Recuperación de Contraseña por Email

## ✅ Lo que se Implementó

- ✅ Sistema completo de recuperación de contraseña
- ✅ Envío de emails con Gmail SMTP
- ✅ Tokens seguros con expiración (1 hora)
- ✅ Rate limiting (3 solicitudes por IP/hora)
- ✅ Páginas UI: `/forgot-password` y `/reset-password`
- ✅ Link "¿Olvidaste tu contraseña?" en login

---

## 📋 Pasos para Activar

### Paso 1: Crear Tabla en la Base de Datos

Ejecuta localmente (con DATABASE_URL apuntando a producción):

```powershell
$env:DATABASE_URL="postgresql://postgres:KARfv0PtQ7Kzdl5r@db.bapptarixtynbrfjarfl.supabase.co:5432/postgres"; npx prisma db push
```

O si tienes `.env.local` configurado:

```powershell
npx prisma db push
```

Esto creará la tabla `password_reset_tokens` en tu base de datos.

---

### Paso 2: Obtener Contraseña de Aplicación de Gmail

1. Ve a: https://myaccount.google.com/
2. **Seguridad** → **Verificación en 2 pasos** (actívalo si no lo tienes)
3. Busca **"Contraseñas de aplicaciones"**
4. **Genera una nueva**:
   - App: "Correo"
   - Dispositivo: "Otro (Sistema de Gestión Restaurantes)"
5. **Copia la contraseña de 16 caracteres** (solo se muestra una vez)

---

### Paso 3: Configurar Variables en Vercel

Ve a **Vercel** → Settings → **Environment Variables** y agrega:

#### Variables Requeridas:

1. **`EMAIL_USER`**
   - Value: Tu email de Gmail completo
   - Ejemplo: `tucorreo@gmail.com`
   - Environments: All Environments

2. **`EMAIL_PASSWORD`**
   - Value: La contraseña de aplicación de 16 caracteres (sin espacios)
   - Ejemplo: `abcdefghijklmnop`
   - ⚠️ **IMPORTANTE**: Usa la contraseña de aplicación, NO tu contraseña normal
   - Environments: All Environments

3. **`EMAIL_FROM`** (Opcional)
   - Value: `"Sistema de Gestión" <tucorreo@gmail.com>`
   - Si no se configura, usará `EMAIL_USER`
   - Environments: All Environments

4. **`NEXT_PUBLIC_APP_URL`** (Recomendado)
   - Value: URL completa de tu app en Vercel
   - Ejemplo: `https://resto-system-pro-9ldp.vercel.app`
   - Environments: All Environments

---

### Paso 4: Redeploy

1. Haz un **Redeploy** en Vercel
2. Espera a que termine

---

### Paso 5: Probar

1. Ve a tu aplicación en Vercel
2. Click en **"¿Olvidaste tu contraseña?"** en la página de login
3. Ingresa un email válido
4. Revisa tu bandeja de entrada (y spam)
5. Click en el enlace del email
6. Establece una nueva contraseña

---

## 🔒 Seguridad Implementada

- ✅ Tokens expiran en **1 hora**
- ✅ Tokens solo se pueden usar **una vez**
- ✅ Rate limiting: **3 solicitudes por IP cada hora**
- ✅ No revela si el email existe o no (protección contra enumeración)
- ✅ Contraseñas deben tener **mínimo 12 caracteres** con letras y números
- ✅ Tokens hasheados en la base de datos

---

## 📧 Flujo de Recuperación

1. Usuario ingresa email en `/forgot-password`
2. Sistema genera token seguro
3. Envía email con enlace (expira en 1 hora)
4. Usuario click en enlace → `/reset-password?token=...`
5. Usuario ingresa nueva contraseña
6. Sistema valida token y actualiza contraseña
7. Token se marca como usado
8. Usuario puede iniciar sesión con nueva contraseña

---

## 🆘 Solución de Problemas

### Error: "Invalid login"
- Verifica que uses **Contraseña de Aplicación**, no tu contraseña normal
- Asegúrate de que no tenga espacios

### Email no llega
- Revisa **Spam**
- Verifica `EMAIL_USER` en Vercel
- Revisa logs de Vercel

### Token expirado
- Los tokens expiran en **1 hora**
- Solicita un nuevo enlace

---

## ✅ Checklist Final

- [ ] Tabla `password_reset_tokens` creada en DB
- [ ] Contraseña de aplicación de Gmail generada
- [ ] `EMAIL_USER` configurado en Vercel
- [ ] `EMAIL_PASSWORD` configurado en Vercel
- [ ] `EMAIL_FROM` configurado (opcional)
- [ ] `NEXT_PUBLIC_APP_URL` configurado (recomendado)
- [ ] Redeploy realizado
- [ ] Prueba exitosa de recuperación

---

## 🎉 ¡Listo!

Una vez completados estos pasos, la recuperación de contraseña estará **100% funcional**.

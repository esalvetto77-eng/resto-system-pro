# ⚠️ Lo que Falta para Activar Recuperación de Contraseña

## ✅ Lo que YA está Listo

- ✅ Código implementado y desplegado en GitHub
- ✅ Tabla de base de datos creada (`password_reset_tokens`)
- ✅ Páginas UI creadas (`/forgot-password` y `/reset-password`)
- ✅ Endpoints API creados

## ❌ Lo que FALTA (Debes Hacerlo Tú)

### 1. Obtener Contraseña de Aplicación de Gmail

**Pasos:**
1. Ve a: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (actívalo si no lo tienes)
3. Busca "Contraseñas de aplicaciones"
4. Genera una nueva:
   - App: "Correo"
   - Dispositivo: "Otro (Sistema de Gestión Restaurantes)"
5. **Copia la contraseña de 16 caracteres** (solo se muestra una vez)

---

### 2. Configurar Variables de Entorno en Vercel

**Ve a Vercel → Tu proyecto → Settings → Environment Variables**

Agrega estas 5 variables:

#### Variable 1: `EMAIL_USER`
- **Key**: `EMAIL_USER`
- **Value**: Tu email de Gmail (ej: `tucorreo@gmail.com`)
- **Environments**: All Environments

#### Variable 2: `EMAIL_PASSWORD`
- **Key**: `EMAIL_PASSWORD`
- **Value**: La contraseña de aplicación de 16 caracteres (sin espacios)
- **Environments**: All Environments

#### Variable 3: `EMAIL_FROM` (Opcional)
- **Key**: `EMAIL_FROM`
- **Value**: `"Sistema de Gestión" <tucorreo@gmail.com>`
- **Environments**: All Environments

#### Variable 4: `NEXT_PUBLIC_APP_URL` (Recomendado)
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://resto-system-pro-9ldp.vercel.app` (tu URL real)
- **Environments**: All Environments

#### Variable 5: `ALLOWED_PASSWORD_RECOVERY_EMAILS` (CRÍTICO)
- **Key**: `ALLOWED_PASSWORD_RECOVERY_EMAILS`
- **Value**: `dueno@resto.com` (SOLO tu email autorizado)
- **Environments**: All Environments

---

### 3. Hacer Redeploy en Vercel

1. Ve a **Deployments**
2. Click en los **tres puntos** (⋯) del último deployment
3. Click en **"Redeploy"**
4. Espera a que termine

---

### 4. Probar

1. Ve a tu app en Vercel
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa tu email autorizado
4. Revisa tu email
5. Click en el enlace
6. Establece nueva contraseña

---

## 🎯 Resumen

**NO está funcionando aún** porque faltan las **variables de entorno en Vercel**.

**Tiempo estimado**: 10-15 minutos para configurar todo.

**Sigue la guía**: `GUIA-COMPLETA-RECUPERACION-CONTRASENA.md`

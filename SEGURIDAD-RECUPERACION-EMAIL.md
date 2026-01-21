# 🔒 Seguridad: Recuperación de Contraseña Solo para Emails Autorizados

## ✅ Protección Implementada

El sistema ahora **SOLO permite** que emails específicos (autorizados) puedan solicitar recuperación de contraseña.

**Esto significa:**
- ✅ Solo TUS emails autorizados pueden recuperar contraseñas
- ✅ Cualquier otro email será rechazado (sin revelar que fue rechazado)
- ✅ Protección contra intentos de recuperación no autorizados

---

## 🔧 Configuración

### Variable de Entorno Requerida:

**`ALLOWED_PASSWORD_RECOVERY_EMAILS`**

- **Formato**: Emails separados por comas
- **Ejemplo**: `dueno@resto.com,admin@resto.com`
- **Ubicación**: Vercel → Settings → Environment Variables
- **Environments**: All Environments

### Ejemplo de Configuración:

Si solo quieres que `dueno@resto.com` pueda recuperar contraseñas:

```
ALLOWED_PASSWORD_RECOVERY_EMAILS=dueno@resto.com
```

Si quieres permitir múltiples emails:

```
ALLOWED_PASSWORD_RECOVERY_EMAILS=dueno@resto.com,admin@resto.com,otro@resto.com
```

---

## 📋 Pasos para Configurar

### Paso 1: Agregar Variable en Vercel

1. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Click en **"Add"** o **"Create new"**
3. En **Key**, escribe: `ALLOWED_PASSWORD_RECOVERY_EMAILS`
4. En **Value**, escribe tu email (o emails separados por comas):
   - Ejemplo: `dueno@resto.com`
   - O múltiples: `dueno@resto.com,admin@resto.com`
5. En **Environments**, selecciona **"All Environments"**
6. Click en **"Save"**

### Paso 2: Redeploy

Haz un **Redeploy** en Vercel para que tome efecto.

---

## 🔒 Comportamiento de Seguridad

### Email Autorizado:
- ✅ Puede solicitar recuperación
- ✅ Recibe email con enlace
- ✅ Puede restablecer contraseña

### Email NO Autorizado:
- ❌ **NO puede** solicitar recuperación
- ❌ **NO recibe** email
- ❌ **NO se revela** que fue rechazado (mismo mensaje genérico)
- ✅ Se registra en logs para auditoría

---

## 📊 Logs de Seguridad

Todos los intentos no autorizados se registran en los logs de Vercel:

```
[AUTH] Intento de recuperación desde email no autorizado: {
  email: "intruso@ejemplo.com",
  ip: "xxx.xxx.xxx.xxx",
  timestamp: "2026-01-21T..."
}
```

Puedes revisar estos logs en **Vercel → Deployments → Logs**.

---

## ⚠️ Importante

### Si NO configuras `ALLOWED_PASSWORD_RECOVERY_EMAILS`:
- ❌ **Nadie** podrá recuperar contraseñas
- El sistema estará completamente bloqueado para recuperación

### Si configuras incorrectamente:
- Verifica que los emails estén en **minúsculas**
- Verifica que no haya espacios extra
- Verifica que estén separados por **comas** (sin espacios)

---

## ✅ Checklist

- [ ] `ALLOWED_PASSWORD_RECOVERY_EMAILS` configurado en Vercel
- [ ] Solo incluye emails que DEBEN poder recuperar contraseñas
- [ ] Redeploy realizado
- [ ] Prueba con email autorizado: ✅ Funciona
- [ ] Prueba con email NO autorizado: ❌ No funciona (correcto)

---

## 🎯 Recomendación

**Configura SOLO tu email principal** (el del dueño):

```
ALLOWED_PASSWORD_RECOVERY_EMAILS=dueno@resto.com
```

Esto garantiza que **SOLO TÚ** puedas recuperar contraseñas, incluso si alguien conoce los emails de otros usuarios.

---

## 🔐 Seguridad Adicional

El sistema también tiene:
- ✅ Rate limiting (3 intentos por IP/hora)
- ✅ Tokens expiran en 1 hora
- ✅ Tokens solo se pueden usar una vez
- ✅ No revela si un email existe o no
- ✅ Logs de intentos no autorizados

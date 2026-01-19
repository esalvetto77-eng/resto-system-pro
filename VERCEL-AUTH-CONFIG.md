# 🔐 Configuración de Autenticación para Vercel

Este documento explica cómo está configurado el sistema de autenticación para funcionar correctamente en Vercel (producción).

## ✅ Configuración Implementada

### 1. Variables de Entorno

**Requeridas en Vercel:**
- `DATABASE_URL` - URL de conexión a PostgreSQL (REQUERIDO)

**Automáticas en Vercel:**
- `VERCEL=1` - Detecta que está en Vercel
- `NODE_ENV=production` - Detecta ambiente de producción
- HTTPS - Vercel provee HTTPS automáticamente

**No se requieren variables adicionales** para autenticación (el sistema funciona con lo básico).

### 2. Configuración de Cookies

```typescript
cookieStore.set('userId', usuario.id, {
  httpOnly: true,        // No accesible desde JavaScript (seguridad)
  secure: isProduction,  // true en Vercel (HTTPS automático)
  sameSite: 'lax',      // Compatible con navegación
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: '/',            // Disponible en toda la app
  // No especificamos 'domain' - Vercel lo maneja
})
```

**Configuración por ambiente:**
- **Local (desarrollo):** `secure: false` (HTTP local)
- **Vercel (producción):** `secure: true` (HTTPS automático)

### 3. Runtime Configuration

**Todas las rutas de autenticación usan Node.js runtime:**

```typescript
export const runtime = 'nodejs'  // ✅ Prisma requiere Node.js
export const dynamic = 'force-dynamic'  // No cachear
```

**¿Por qué Node.js y no Edge?**
- Prisma Client requiere Node.js runtime
- Edge runtime tiene limitaciones con Prisma
- Cookies funcionan en ambos, pero Prisma no

**Rutas configuradas:**
- `/api/auth/login` - ✅ Node.js
- `/api/auth/me` - ✅ Node.js
- `/api/auth/logout` - ✅ Node.js
- `/api/auth/debug` - ✅ Node.js

### 4. Headers de No-Cache

Todos los endpoints de autenticación incluyen headers para evitar caché:

```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
response.headers.set('Pragma', 'no-cache')
response.headers.set('Expires', '0')
```

**¿Por qué?**
- Evita que navegadores o proxies cacheen respuestas de autenticación
- Garantiza que cada request consulte la DB para obtener el rol actual
- Previene problemas de estado cruzado entre usuarios

### 5. Detección de Ambiente

El sistema detecta automáticamente si está en Vercel:

```typescript
const isVercel = process.env.VERCEL === '1'
const isProduction = process.env.NODE_ENV === 'production' || isVercel
```

Esto permite:
- Configurar cookies correctamente (`secure: true` en Vercel)
- Usar configuración apropiada según ambiente
- Logs específicos para debugging

## 🔍 Validación en Vercel

### 1. Verificar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

**Requerida:**
- `DATABASE_URL` = `postgresql://...` (tu URL de PostgreSQL)

**Automáticas (Vercel las configura):**
- `VERCEL=1`
- `NODE_ENV=production`

### 2. Verificar Cookies

Después del deploy, haz login y verifica en DevTools → Application → Cookies:

**Cookie `userId`:**
- `HttpOnly`: ✅ true
- `Secure`: ✅ true (en producción)
- `SameSite`: `Lax`
- `Path`: `/`
- `Domain`: Tu dominio de Vercel (automático)

### 3. Endpoint de Debug

Visita: `https://tu-app.vercel.app/api/auth/debug`

Debería mostrar:
```json
{
  "ambiente": {
    "vercel": "Sí",
    "produccion": "Sí",
    "runtime": "nodejs"
  },
  "cookie": {
    "config": {
      "secure": true,
      "httpOnly": true,
      "sameSite": "lax"
    }
  },
  "validacion": {
    "coinciden": true,
    "mensaje": "✅ FUENTE DE VERDAD CONSISTENTE"
  }
}
```

### 4. Verificar No-Cache

En DevTools → Network:
1. Haz una request a `/api/auth/me`
2. Verifica headers de respuesta:
   - `Cache-Control: no-store, no-cache, must-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`

## 🚨 Diferencias Local vs Vercel

| Aspecto | Local | Vercel |
|---------|-------|--------|
| **HTTPS** | No (HTTP) | Sí (automático) |
| **Cookie Secure** | `false` | `true` (automático) |
| **Domain Cookie** | `localhost` | Dominio de Vercel |
| **Runtime** | Node.js | Node.js (igual) |
| **Database** | SQLite (puede ser) | PostgreSQL (requerido) |
| **Variables** | `.env` local | Variables en Dashboard |

## ✅ Checklist Pre-Deploy

Antes de hacer deploy en Vercel, verifica:

- [ ] `DATABASE_URL` configurada en Vercel (PostgreSQL)
- [ ] Todas las rutas de auth tienen `export const runtime = 'nodejs'`
- [ ] Todas las rutas de auth tienen `export const dynamic = 'force-dynamic'`
- [ ] Headers de no-cache en respuestas de auth
- [ ] Cookies configuradas con `secure: isProduction`
- [ ] Prisma Client generado (`postinstall` en package.json)

## 🔧 Troubleshooting

### Problema: Cookies no se guardan en Vercel

**Causa:** Cookie `secure: true` pero conexión HTTP (no debería pasar)

**Solución:** Vercel provee HTTPS automáticamente. Si estás en un custom domain sin HTTPS, activa SSL en Vercel.

### Problema: `/api/auth/me` retorna 401 siempre

**Causa posible:** Cookies no se envían correctamente

**Verificar:**
1. Cookie existe en DevTools → Application → Cookies
2. Cookie tiene `SameSite: Lax` (no `Strict` si vienes de otro sitio)
3. Request incluye cookie en DevTools → Network → Headers

### Problema: Rol incorrecto en producción

**Causa posible:** Caché o estado antiguo

**Solución:**
- Los headers `no-cache` previenen esto
- El sistema siempre consulta DB en cada request
- Si persiste, verifica que `export const dynamic = 'force-dynamic'` esté presente

### Problema: Error "Prisma Client not initialized"

**Causa:** Edge runtime o Prisma Client no generado

**Solución:**
- Asegurar `export const runtime = 'nodejs'` en todas las rutas con Prisma
- Verificar que `postinstall: prisma generate` esté en `package.json`
- Verificar que Prisma Client se genere durante build en Vercel

## 📝 Notas Finales

1. **Vercel usa HTTPS automáticamente** - No necesitas configurar nada
2. **Cookies funcionan igual** - La única diferencia es `secure: true` en producción
3. **Runtime es Node.js** - Tanto en local como en Vercel (para Prisma)
4. **No hay caché de sesión** - Headers de no-cache garantizan DB fresh
5. **Fuente de verdad es DB** - Siempre, en ambos ambientes

El sistema funciona **idéntico** en local y Vercel, solo cambia la configuración de cookies (`secure`) según el ambiente.

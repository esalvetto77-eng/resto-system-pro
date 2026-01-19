# ⚙️ Configuración para Vercel - Variables de Entorno

## 📋 Variables Requeridas

Configura estas variables en **Vercel Dashboard → Settings → Environment Variables**:

### Base de Datos (CRÍTICO)

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

**Dónde obtener:**
- Vercel Postgres: Dashboard → Storage → Create Database → Postgres
- Neon: Dashboard → Connection String
- Supabase: Settings → Database → Connection String

### Autenticación

**No se requieren variables adicionales** para autenticación.

El sistema usa:
- Cookies para sesión (`userId` guardado en cookie httpOnly)
- Base de datos para roles (consultado en cada request)
- `NODE_ENV` y `VERCEL` (configurados automáticamente por Vercel)

## 🔄 Variables Automáticas en Vercel

Vercel configura automáticamente:
- `VERCEL=1` - Detecta que está en Vercel
- `NODE_ENV=production` - Ambiente de producción
- HTTPS - Automático (todas las URLs usan HTTPS)

## ✅ Configuración de Cookies

El sistema detecta automáticamente si está en Vercel:

```typescript
// En login/route.ts
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
const isVercel = process.env.VERCEL === '1'

cookieStore.set('userId', usuario.id, {
  httpOnly: true,        // Seguridad
  secure: isProduction,  // true en Vercel (HTTPS automático)
  sameSite: 'lax',      // Compatible con navegación
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: '/',            // Toda la app
})
```

**Resultado:**
- Local: `secure: false` (HTTP local)
- Vercel: `secure: true` (HTTPS automático)

## 🚀 Runtime Configuration

Todas las rutas de autenticación usan **Node.js runtime** (requerido para Prisma):

```typescript
export const runtime = 'nodejs'  // Prisma requiere Node.js
export const dynamic = 'force-dynamic'  // No cachear
```

**Rutas configuradas:**
- `/api/auth/login` ✅
- `/api/auth/me` ✅
- `/api/auth/logout` ✅
- `/api/auth/debug` ✅

## 🔒 Headers de No-Cache

Todos los endpoints de auth incluyen headers para evitar caché:

```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
response.headers.set('Pragma', 'no-cache')
response.headers.set('Expires', '0')
```

Esto previene:
- Caché de sesiones entre usuarios
- Estado cruzado
- Roles obsoletos en caché

## ✅ Checklist de Configuración

Antes de deploy en Vercel:

- [ ] `DATABASE_URL` configurada (PostgreSQL)
- [ ] Verificar que rutas auth tienen `runtime = 'nodejs'`
- [ ] Verificar que rutas auth tienen `dynamic = 'force-dynamic'`
- [ ] Cookies configuradas con detección automática de Vercel
- [ ] Headers de no-cache en todas las respuestas de auth

## 🧪 Validación Post-Deploy

1. **Verificar cookies:**
   - DevTools → Application → Cookies
   - Cookie `userId` debe tener `Secure: true`

2. **Verificar no-cache:**
   - DevTools → Network → `/api/auth/me`
   - Headers deben incluir `Cache-Control: no-store`

3. **Endpoint de debug:**
   - Visita: `https://tu-app.vercel.app/api/auth/debug`
   - Debe mostrar `ambiente.vercel: "Sí"`

4. **Verificar login:**
   - Login debe funcionar correctamente
   - Cookies deben guardarse
   - Rol debe obtenerse de DB

## 📝 Notas Importantes

1. **No necesitas configurar `DOMAIN` en cookies** - Vercel lo maneja automáticamente
2. **HTTPS es automático** - No necesitas configurar SSL
3. **Runtime es Node.js** - Tanto en local como en Vercel (para Prisma)
4. **No hay variables de auth adicionales** - Solo `DATABASE_URL`

El sistema funciona **idéntico** en local y Vercel, adaptándose automáticamente según el ambiente.

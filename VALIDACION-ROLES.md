# 🔍 Validación del Sistema de Roles

Este documento explica cómo funciona el sistema de roles y cómo validarlo.

## 📊 Flujo del Sistema de Roles

### 1. Login (Almacenamiento)

```
Usuario hace login
  ↓
Backend valida credenciales contra DB
  ↓
Cookie guardada: SOLO userId (NO el rol)
  ↓
Frontend recibe: { id, email, rol } en respuesta JSON
  ↓
Frontend guarda rol en estado React (AuthContext)
```

**Fuente de Verdad en Login:** Base de Datos

**Cookie guardada:** Solo `userId` (httpOnly, secure en producción)

**Rol NO se guarda en cookie** - Se consulta de DB en cada request

### 2. Verificación de Autenticación (Frontend)

```
AuthContext.checkAuth() se ejecuta
  ↓
Fetch a /api/auth/me
  ↓
Backend: getCurrentUser() consulta DB usando userId de cookie
  ↓
Backend retorna: { id, email, rol }
  ↓
Frontend actualiza estado React con el rol
```

**Fuente de Verdad:** Base de Datos (consultada vía `getCurrentUser()`)

**Estado Frontend:** React State (derivado de DB)

### 3. Verificación de Permisos (Backend)

```
Request llega a API route
  ↓
API route llama: getCurrentUser()
  ↓
getCurrentUser() lee userId de cookie
  ↓
getCurrentUser() consulta DB: SELECT rol FROM usuarios WHERE id = ?
  ↓
API route verifica: isAdmin(user) o hasRole(user, 'ADMIN')
  ↓
Permite o rechaza acceso
```

**Fuente de Verdad:** Base de Datos (consulta directa en cada request)

### 4. Verificación de Permisos (Frontend)

```
Componente necesita verificar rol
  ↓
useAuth() retorna { isAdmin, user }
  ↓
isAdmin() verifica: user?.rol === 'ADMIN'
  ↓
user.rol viene de estado React
  ↓
Estado React se actualiza desde /api/auth/me
  ↓
/api/auth/me consulta DB
```

**Fuente de Verdad:** Estado React (que viene de DB vía `/api/auth/me`)

## ✅ Fuente de Verdad Única

**Backend y Frontend usan la MISMA fuente de verdad:**

- **Backend:** Consulta DB directamente en cada request (`getCurrentUser()`)
- **Frontend:** Obtiene rol de `/api/auth/me` que consulta DB
- **Ventaja:** Si el rol cambia en DB, ambos lo ven en el siguiente request

## 🔍 Cómo Validar

### 1. Endpoint de Debug

Visita: `http://localhost:3002/api/auth/debug`

Este endpoint muestra:
- Cookie actual
- Usuario desde `getCurrentUser()`
- Usuario desde consulta directa a DB
- Validación de consistencia
- Explicación de la fuente de verdad

### 2. Logs en Consola

Abre la consola del navegador y verás logs con prefijos:

- `[AUTH]` - Logs de autenticación (backend)
- `[API]` - Logs de endpoints API
- `[FRONTEND]` - Logs del frontend (AuthContext)
- `[GUARD]` - Logs del componente AdminOnly

### 3. Logs en Terminal (Backend)

En el terminal donde corre el servidor verás logs de:
- `[AUTH] getCurrentUser:` - Cada vez que se consulta el usuario
- `[API] /api/auth/me:` - Cada vez que el frontend verifica autenticación

## 🧪 Pruebas Recomendadas

### Test 1: Verificar Fuente de Verdad

1. Haz login como ADMIN
2. Visita `/api/auth/debug`
3. Verifica que `validacion.coinciden` sea `true`
4. Verifica que `getCurrentUser` y `consultaDirectaDB` tengan el mismo rol

### Test 2: Verificar Frontend

1. Abre DevTools → Console
2. Haz login
3. Busca logs `[FRONTEND] AuthContext.checkAuth:`
4. Verifica que el rol recibido sea correcto
5. Navega a una página protegida (ej: `/empleados`)
6. Busca logs `[GUARD] AdminOnly:`
7. Verifica que el guard reciba el rol correcto

### Test 3: Verificar Backend

1. Abre el terminal del servidor
2. Haz una request a una API protegida (ej: `GET /api/empleados`)
3. Busca logs `[AUTH] getCurrentUser:`
4. Verifica que el rol se obtiene de DB
5. Verifica logs `[API]` para confirmar protección

### Test 4: Cambio de Rol (Si es posible)

1. Cambia el rol de un usuario directamente en la DB
2. Haz una nueva request (sin hacer logout/login)
3. Verifica que el nuevo rol se refleje en el siguiente request
4. Esto confirma que siempre se consulta de DB

## 📝 Resumen

| Aspecto | Detalle |
|---------|---------|
| **Dónde se guarda el rol** | Base de Datos (tabla `usuarios`) |
| **Dónde NO se guarda el rol** | Cookie (solo `userId`) |
| **Backend obtiene rol** | De DB en cada request vía `getCurrentUser()` |
| **Frontend obtiene rol** | De `/api/auth/me` que consulta DB |
| **Cuándo está disponible** | Después de login, en cada request |
| **AdminOnly recibe rol** | Del hook `useAuth()` que viene de estado React |
| **Misma fuente de verdad** | ✅ Sí - Ambos consultan DB (directo o vía API) |

## ⚠️ Notas Importantes

1. **El rol NO está en la cookie** - Solo `userId` está en la cookie
2. **Cada request consulta DB** - Backend siempre obtiene el rol más reciente
3. **Frontend cachea en estado** - Si el rol cambia, frontend se actualiza en el próximo `/api/auth/me`
4. **Si cambias rol en DB** - Se refleja automáticamente en el siguiente request
5. **Logs están habilitados** - Revisa consola del navegador y terminal del servidor

## 🔧 Endpoints de Validación

- `GET /api/auth/debug` - Información completa del sistema de roles
- `GET /api/auth/me` - Usuario actual (con logs)
- Cualquier API protegida mostrará logs de verificación

# 🔍 Diagnóstico de Error de Login

## Paso 1: Verificar Usuarios en la Base de Datos

Accede a tu aplicación en Vercel y abre esta URL en el navegador:

```
https://TU-APP-VERCEL.vercel.app/api/auth/debug
```

**⚠️ IMPORTANTE:** Reemplaza `TU-APP-VERCEL` con la URL real de tu aplicación en Vercel.

Esta URL mostrará:
- Todos los usuarios en la base de datos
- El usuario actual (si estás logueado)
- El estado de la cookie
- Información del ambiente

## Paso 2: Verificar Logs de Vercel

1. Ve a Vercel → Tu proyecto → **Logs** (o **Deployments** → Click en el último deployment → **Logs**)
2. Intenta iniciar sesión nuevamente
3. Busca mensajes que empiecen con `[AUTH]`
4. Copia cualquier error que veas

Los logs mostrarán:
- Si el usuario existe
- Si la contraseña es correcta
- Si el usuario está activo
- Cualquier error específico

## Paso 3: Verificar Variables de Entorno

1. Ve a Vercel → Settings → **Environment Variables**
2. **VERIFICA** que existe `DATABASE_URL` (no solo `POSTGRES_PRISMA_URL`)
3. Si **NO existe**, créala:
   - Key: `DATABASE_URL`
   - Value: El mismo valor que usamos localmente (de `POSTGRES_PRISMA_URL`)
   - Environments: All Environments

## Paso 4: Verificar el Error Específico

Cuando intentas iniciar sesión, ¿qué mensaje exacto aparece?

- ¿"Credenciales inválidas"?
- ¿"Error al iniciar sesión"?
- ¿"Usuario no encontrado"?
- ¿Otro mensaje?

---

## Posibles Problemas y Soluciones

### Problema 1: DATABASE_URL no está en Vercel
**Solución:** Crea `DATABASE_URL` en Environment Variables con el valor de `POSTGRES_PRISMA_URL`

### Problema 2: Los usuarios no existen en la base de datos de producción
**Solución:** Ejecuta `npx ts-node scripts/crear-usuarios-produccion.ts` localmente con `DATABASE_URL` apuntando a la DB de producción

### Problema 3: Las contraseñas no coinciden
**Solución:** Verifica en `/api/auth/debug` que los usuarios existen y tienen las contraseñas correctas

### Problema 4: Cookies bloqueadas
**Solución:** Verifica que tu navegador permita cookies de terceros (aunque Vercel debería manejar esto automáticamente)

---

## Siguiente Paso

1. **Accede a `/api/auth/debug`** con tu URL real de Vercel
2. **Comparte el resultado** que ves (sin contraseñas)
3. **Compárteme el error exacto** que aparece al intentar iniciar sesión
4. **Verifica DATABASE_URL** en Vercel Environment Variables

Con esa información podré identificar el problema exacto y solucionarlo.

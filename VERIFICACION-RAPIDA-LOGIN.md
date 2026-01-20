# ✅ Verificación Rápida de Login

## URL de tu Aplicación
```
https://resto-system-pro-9ldp.vercel.app
```

## Paso 1: Verificar Usuarios en la Base de Datos

Abre esta URL en tu navegador:
```
https://resto-system-pro-9ldp.vercel.app/api/auth/debug
```

**¿Qué deberías ver?**
- Una página JSON con información sobre usuarios
- Busca la sección `usuariosEnDB`
- Verifica que existan `dueno@resto.com` y `encargado@resto.com`

## Paso 2: Verificar DATABASE_URL en Vercel

1. Ve a Vercel → Settings → Environment Variables
2. **VERIFICA** que existe `DATABASE_URL` (no solo `POSTGRES_PRISMA_URL`)
3. Si **NO existe**, créala:
   - Key: `DATABASE_URL`
   - Value: Copia el valor de `POSTGRES_PRISMA_URL`
   - Environments: All Environments
   - Save

## Paso 3: Probar Login

1. Ve a: `https://resto-system-pro-9ldp.vercel.app`
2. Intenta iniciar sesión con:
   - Email: `dueno@resto.com`
   - Contraseña: `123456`

**¿Qué mensaje aparece?**
- ¿"Credenciales inválidas"?
- ¿"Error al iniciar sesión"?
- ¿Otro?

## Paso 4: Ver Logs de Vercel

1. En la misma página de deployment que estás viendo
2. Haz scroll hacia abajo
3. Busca **"Build Logs"** o **"Logs"**
4. Intenta iniciar sesión nuevamente
5. Revisa los logs para ver mensajes con `[AUTH]`

---

## Si el Error Persiste

**Compárteme:**
1. ✅ El resultado de `/api/auth/debug` (qué usuarios ves)
2. ✅ Si `DATABASE_URL` existe en Vercel Environment Variables
3. ✅ El mensaje exacto que aparece al intentar iniciar sesión
4. ✅ Cualquier error en los logs de Vercel

Con esa información podré identificar el problema exacto.

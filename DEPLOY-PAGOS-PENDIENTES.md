# Deploy de Pagos Pendientes en Vercel

## ✅ Cambios Subidos

Los cambios ya fueron commiteados y pusheados a GitHub. Vercel debería detectar automáticamente el push y comenzar un nuevo deploy.

## 🔄 Pasos para Completar el Deploy

### 1. **Esperar el Deploy en Vercel**

- Ve a tu dashboard de Vercel: https://vercel.com/dashboard
- Deberías ver un nuevo deploy en progreso
- Espera a que termine (puede tardar 2-5 minutos)

### 2. **Aplicar el Schema de Base de Datos en Producción**

**IMPORTANTE:** El modelo `PagoPendiente` necesita estar en tu base de datos de producción (Supabase).

Tienes dos opciones:

#### **Opción A: Desde Vercel (Recomendado)**

1. Ve a tu proyecto en Vercel
2. Ve a "Settings" → "Environment Variables"
3. Verifica que `DATABASE_URL` esté configurada
4. Ve a "Deployments" → Selecciona el último deploy
5. En "Functions" o "Build Logs", verifica que no haya errores de Prisma

#### **Opción B: Desde tu máquina local (Si tienes acceso a la DB)**

```bash
# Conecta a la base de datos de producción
# (Usa la DATABASE_URL de Vercel)
$env:DATABASE_URL="postgresql://..." # Tu DATABASE_URL de Vercel
npx prisma db push
```

### 3. **Verificar que el Deploy Funcionó**

Una vez que el deploy termine:

1. Ve a tu aplicación en Vercel: `https://tu-app.vercel.app`
2. Inicia sesión como DUEÑO/ADMIN
3. Deberías ver:
   - **En el Sidebar:** "Pagos Pendientes" (después de "Eventos Mensuales")
   - **En el Dashboard:** KPI card "Pagos Pendientes"
   - **Acceso directo:** `https://tu-app.vercel.app/pagos-pendientes`

### 4. **Si el Deploy Falla**

Si ves errores en el build de Vercel:

1. **Error de Prisma:**
   - Verifica que `DATABASE_URL` esté configurada en Vercel
   - El modelo `PagoPendiente` se creará automáticamente con `prisma db push` durante el build

2. **Error de TypeScript:**
   - Verifica que todos los archivos estén correctamente importados
   - Revisa los logs del build en Vercel

3. **Error de Runtime:**
   - Verifica que `prisma generate` se ejecute en el build (ya está en `package.json`)

## 📋 Checklist Post-Deploy

- [ ] Deploy completado en Vercel
- [ ] Base de datos actualizada (tabla `pagos_pendientes` existe)
- [ ] Puedo acceder a `/pagos-pendientes` como DUEÑO
- [ ] Veo el KPI "Pagos Pendientes" en el Dashboard
- [ ] Veo "Pagos Pendientes" en el Sidebar
- [ ] Puedo crear un nuevo pago pendiente

## 🔍 Verificación Rápida

Ejecuta estos comandos para verificar localmente antes de deployar:

```bash
# 1. Verificar que Prisma Client esté generado
npx prisma generate

# 2. Verificar que compile sin errores
npm run build

# 3. Si todo está bien, los cambios ya están en GitHub
# Vercel los detectará automáticamente
```

## ⚠️ Nota Importante

Si después del deploy no ves "Pagos Pendientes":

1. **Verifica tu rol:** Debes estar logueado como `ADMIN` o `DUENO`
   - Ve a: `https://tu-app.vercel.app/api/auth/debug`
   - Verifica que `rol` sea `ADMIN` o `DUENO`

2. **Limpia la cache del navegador:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)

3. **Verifica que la tabla exista en la DB:**
   - En Supabase, verifica que exista la tabla `pagos_pendientes`
   - Si no existe, ejecuta `npx prisma db push` con la `DATABASE_URL` de producción

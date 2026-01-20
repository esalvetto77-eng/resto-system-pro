# ✅ Pasos Después de Crear la Base de Datos (Supabase)

## Paso 1: Verificar que DATABASE_URL está Configurada

1. Ve a Vercel → Tu proyecto → **Settings** → **Environment Variables**
2. Busca la variable `DATABASE_URL`
3. Debería tener un valor que empieza con `postgresql://...`
4. Si **NO aparece**, espera unos segundos y recarga la página (Vercel tarda un momento en configurarla)

## Paso 2: Obtener la DATABASE_URL

1. Copia el valor completo de `DATABASE_URL` desde Vercel
2. Lo necesitarás para el siguiente paso

## Paso 3: Crear las Tablas en la Base de Datos

1. En tu proyecto local, crea un archivo `.env.local` en la raíz del proyecto
2. Agrega esta línea (usa tu DATABASE_URL de Vercel):
   ```env
   DATABASE_URL=postgresql://... (tu URL de Supabase/Vercel)
   ```
3. Ejecuta este comando para crear todas las tablas:
   ```bash
   npx prisma db push
   ```
4. Deberías ver un mensaje como: `✨ Your database is now in sync with your Prisma schema`

## Paso 4: Crear los Usuarios

1. Con la misma `DATABASE_URL` en `.env.local`, ejecuta:
   ```bash
   npx ts-node scripts/crear-usuarios-produccion.ts
   ```
2. Deberías ver:
   ```
   ✅ Usuario DUEÑO creado exitosamente
   ✅ Usuario ENCARGADO creado exitosamente
   ```

## Paso 5: Verificar que Funciona

1. Espera a que Vercel termine el próximo deploy automático (o haz uno manual)
2. Ve a tu aplicación en Vercel
3. Intenta iniciar sesión con:
   - **Email:** `dueno@resto.com`
   - **Contraseña:** `123456`

## ✅ ¡Listo!

Si todo salió bien, deberías poder iniciar sesión y ver el dashboard.

---

## 🔍 Verificar Usuarios en la Base de Datos

Después del deploy, puedes verificar accediendo a:
```
https://tu-app.vercel.app/api/auth/debug
```

Esto mostrará todos los usuarios en tu base de datos.

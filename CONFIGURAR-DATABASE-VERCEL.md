# 🗄️ Configurar Base de Datos en Vercel

## El Problema
No tienes la variable `DATABASE_URL` configurada en Vercel, por eso no puedes crear usuarios ni usar la aplicación.

## Solución: Configurar Base de Datos PostgreSQL

Tienes **2 opciones**:

---

## Opción 1: Usar Vercel Postgres (RECOMENDADO - Más Fácil)

### Paso 1: Crear Base de Datos en Vercel
1. Ve a tu proyecto en Vercel
2. En el menú lateral izquierdo, busca **"Storage"** o **"Databases"**
3. Click en **"Create Database"** o **"Add Database"**
4. Selecciona **"Postgres"**
5. Elige un plan (el gratuito funciona para empezar)
6. Dale un nombre a tu base de datos (ej: `resto-db`)
7. Selecciona la región más cercana a ti
8. Click en **"Create"**

### Paso 2: Vercel Configura Automáticamente
- Vercel creará automáticamente la variable `DATABASE_URL` en Environment Variables
- La variable se conectará automáticamente a tu base de datos

### Paso 3: Verificar que se Creó
1. Ve a **Settings** → **Environment Variables**
2. Deberías ver `DATABASE_URL` con un valor que empieza con `postgresql://...`
3. Si no aparece, espera unos segundos y recarga la página

### Paso 4: Crear las Tablas
Después de que Vercel termine el próximo deploy, ejecuta localmente:

1. Crea `.env.local` con tu `DATABASE_URL` de Vercel
2. Ejecuta:
   ```bash
   npx prisma db push
   ```
   Esto creará todas las tablas en tu base de datos de producción.

### Paso 5: Crear Usuarios
```bash
npx ts-node scripts/crear-usuarios-produccion.ts
```

---

## Opción 2: Usar Base de Datos Externa (Supabase, Neon, etc.)

Si ya tienes una base de datos PostgreSQL externa:

### Paso 1: Obtener la URL de Conexión
Desde tu proveedor de base de datos (Supabase, Neon, Railway, etc.), copia la **Connection String** o **Connection URL**.

Formato típico:
```
postgresql://usuario:password@host:puerto/database?schema=public
```

### Paso 2: Agregar en Vercel
1. Ve a **Settings** → **Environment Variables**
2. Click en **"Create new"** o el botón **"Add"**
3. En **Key**, escribe: `DATABASE_URL`
4. En **Value**, pega tu URL de conexión
5. En **Environments**, selecciona **"All Environments"** (o solo Production)
6. Click en **"Save"**

### Paso 3: Crear las Tablas
```bash
# Configura DATABASE_URL en .env.local primero
npx prisma db push
```

### Paso 4: Crear Usuarios
```bash
npx ts-node scripts/crear-usuarios-produccion.ts
```

---

## ⚠️ IMPORTANTE: Después de Configurar DATABASE_URL

1. **Haz un nuevo deploy** en Vercel (o espera a que se despliegue automáticamente)
2. **Crea las tablas** ejecutando `npx prisma db push` localmente apuntando a la DB de producción
3. **Crea los usuarios** ejecutando el script `crear-usuarios-produccion.ts`
4. **Prueba el login** con `dueno@resto.com` / `123456`

---

## 🔍 Verificar que Funciona

Después de configurar todo, puedes verificar accediendo a:
```
https://tu-app.vercel.app/api/auth/debug
```

Esto mostrará información sobre la conexión y los usuarios en la base de datos.

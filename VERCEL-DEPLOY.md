# 🚀 Guía de Deploy en Vercel

Esta guía te ayudará a desplegar tu sistema de gestión de restaurantes en Vercel de forma profesional y estable.

## 📋 Pre-requisitos

1. **Cuenta en Vercel** - [Crear cuenta gratuita](https://vercel.com/signup)
2. **Repositorio Git** - Tu código debe estar en GitHub, GitLab o Bitbucket
3. **Base de datos PostgreSQL** - Vercel Postgres, Neon, Supabase u otro proveedor
4. **Node.js 18+** - Verificado en el proyecto

## ⚠️ IMPORTANTE: Cambios Necesarios Antes del Deploy

### 1. Base de Datos - CRÍTICO

**SQLite NO funciona en Vercel**. Debes migrar a PostgreSQL:

1. **Obtener URL de PostgreSQL**:
   - **Opción A - Vercel Postgres** (Recomendado):
     - En tu proyecto de Vercel → Storage → Create Database → Postgres
     - Copia la `DATABASE_URL` generada automáticamente
   
   - **Opción B - Neon** (Gratuito):
     - Crear cuenta en [Neon](https://neon.tech)
     - Crear proyecto y copiar la connection string
   
   - **Opción C - Supabase**:
     - Crear proyecto en [Supabase](https://supabase.com)
     - Settings → Database → Connection string

2. **Actualizar schema.prisma**:
   El schema ya está configurado para PostgreSQL. Solo necesitas la URL.

3. **Configurar variables de entorno**:
   - En Vercel: Settings → Environment Variables
   - Agregar: `DATABASE_URL` = `postgresql://...`

### 2. Variables de Entorno Requeridas

Configura estas variables en **Vercel → Settings → Environment Variables**:

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

## 🚀 Pasos para Deploy

### Paso 1: Preparar el Repositorio

```bash
# Asegúrate de que todo esté commitado
git add .
git commit -m "Preparado para producción en Vercel"
git push origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Add New..." → "Project"**
3. Importa tu repositorio Git
4. Vercel detectará automáticamente que es un proyecto Next.js

### Paso 3: Configurar el Proyecto

#### Configuración Automática (Recomendada)

Vercel detecta automáticamente:
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build` (incluye `prisma generate`)
- ✅ Output Directory: `.next`
- ✅ Install Command: `npm install`

#### Configuración Manual (Si es necesario)

Si necesitas configurar manualmente:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (por defecto)
- **Install Command**: `npm install`

### Paso 4: Variables de Entorno

En **Settings → Environment Variables**, agrega:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | **REQUERIDO** - URL de tu base de datos PostgreSQL |

### Paso 5: Deploy

1. Click en **"Deploy"**
2. Vercel ejecutará:
   - `npm install`
   - `npm run build` (que incluye `prisma generate`)
   - Deploy automático

### Paso 6: Migrar Base de Datos

**IMPORTANTE**: Después del primer deploy, ejecuta las migraciones:

#### Opción A - Desde Terminal Local

```bash
# Configurar DATABASE_URL temporalmente
export DATABASE_URL="postgresql://..." # Tu URL de producción

# Ejecutar migraciones
npx prisma migrate deploy
```

#### Opción B - Desde Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link proyecto
vercel link

# Ejecutar migraciones (se ejecutará en el entorno de producción)
vercel env pull .env.production
npx prisma migrate deploy
```

#### Opción C - Script Post-Deploy (Recomendado para producción)

Puedes agregar un script en `package.json`:

```json
"scripts": {
  "deploy": "prisma migrate deploy && next build"
}
```

Y configurarlo en Vercel como Build Command.

### Paso 7: Verificar Deploy

1. Espera a que termine el build (2-5 minutos)
2. Visita la URL proporcionada por Vercel (ej: `tu-proyecto.vercel.app`)
3. Verifica que la aplicación carga correctamente
4. Prueba el login y funcionalidades principales

## 🔧 Configuración Post-Deploy

### Generar Cliente de Prisma

El script `postinstall` en `package.json` ejecuta `prisma generate` automáticamente después de `npm install` en Vercel. Esto es **crítico** para que Prisma funcione.

### Seed de Datos Iniciales (Opcional)

Si necesitas datos iniciales:

```bash
# Desde local con DATABASE_URL de producción
export DATABASE_URL="postgresql://..."
npm run db:seed
```

**⚠️ Cuidado**: Solo ejecuta seed en producción si realmente necesitas datos de prueba.

## 🔍 Troubleshooting

### Error: "Prisma Client not generated"

**Solución**: El `postinstall` script debería ejecutarse automáticamente. Verifica en Build Logs de Vercel.

### Error: "DATABASE_URL not found"

**Solución**: 
- Verifica que agregaste `DATABASE_URL` en Variables de Entorno
- Asegúrate de que esté disponible en **Production**, **Preview** y **Development**

### Error: "Table does not exist"

**Solución**: Ejecuta las migraciones:
```bash
npx prisma migrate deploy
```

### Error: Build timeout

**Solución**:
- Verifica que no haya dependencias pesadas innecesarias
- Optimiza imports
- Considera aumentar el timeout en Vercel (Settings → General → Build & Development Settings)

### Error: "Port 3002 already in use"

**Solución**: Este error NO debería aparecer en Vercel. Vercel maneja puertos automáticamente. Si aparece, significa que hay código hardcodeando puertos (revisar).

## 📊 Monitoreo

### Logs en Vercel

- **Dashboard → Tu Proyecto → Deployments → [Deployment] → Logs**
- Aquí verás logs de build y runtime

### Prisma Studio en Producción (Solo para Debug)

**NO recomendado para producción**, pero si necesitas debuggear:

```bash
# Configurar DATABASE_URL
export DATABASE_URL="postgresql://..."

# Ejecutar (solo desde local)
npx prisma studio
```

## 🔐 Seguridad

### Variables Sensibles

- ✅ **NUNCA** comitees `.env` al repositorio
- ✅ **SIEMPRE** usa Variables de Entorno en Vercel
- ✅ Usa `.env.example` para documentar variables necesarias

### Base de Datos

- Usa conexiones SSL en producción
- Limita accesos por IP si tu proveedor lo permite
- Rota contraseñas periódicamente

## 🎯 Checklist Pre-Deploy

Antes de hacer deploy, verifica:

- [ ] Código en repositorio Git
- [ ] `package.json` tiene `postinstall` script
- [ ] `prisma/schema.prisma` usa `env("DATABASE_URL")`
- [ ] No hay referencias a `localhost:3002` en código de producción
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] `next.config.js` está correcto
- [ ] Base de datos PostgreSQL configurada
- [ ] `DATABASE_URL` agregada en Vercel
- [ ] `npm run build` funciona localmente (sin errores)

## 📝 Notas Adicionales

### Puerto en Desarrollo vs Producción

- **Desarrollo local**: Usa puerto 3002 (configurado en `package.json`)
- **Vercel**: Maneja puertos automáticamente (no configurar)

### Build Command

El script `build` en `package.json` incluye:
```json
"build": "prisma generate && next build"
```

Esto asegura que Prisma Client se genere antes del build.

### Prisma en Vercel

Vercel ejecuta `postinstall` automáticamente después de `npm install`, pero también incluimos `prisma generate` en el build command para estar seguros.

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los **Build Logs** en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que la base de datos PostgreSQL esté accesible
4. Revisa la documentación de [Vercel](https://vercel.com/docs) y [Prisma](https://www.prisma.io/docs)

---

**¡Listo para producción! 🎉**

Después del deploy, tu aplicación estará disponible en `tu-proyecto.vercel.app` y podrás configurar un dominio personalizado en Settings → Domains.

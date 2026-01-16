# ✅ Checklist Pre-Deploy para Vercel

Usa esta lista para verificar que todo esté listo antes de desplegar en Vercel.

## 📋 Antes de Hacer Deploy

### 1. Base de Datos PostgreSQL ⚠️ CRÍTICO

- [ ] **Tienes una base de datos PostgreSQL configurada**
  - Opciones: Vercel Postgres, Neon, Supabase, Railway, etc.
  - SQLite NO funciona en Vercel

- [ ] **Tienes la URL de conexión PostgreSQL**
  - Formato: `postgresql://user:password@host:5432/database?schema=public`
  - Copiada y guardada de forma segura

- [ ] **schema.prisma está configurado para PostgreSQL**
  - ✅ Ya está actualizado: `provider = "postgresql"`
  - ✅ Ya está configurado: `url = env("DATABASE_URL")`

### 2. Variables de Entorno

- [ ] **DATABASE_URL configurada**
  - Valor: URL completa de PostgreSQL
  - Disponible en: Production, Preview, Development

- [ ] **No hay variables hardcodeadas en el código**
  - ✅ Revisado: No hay referencias a `localhost:3002` en código de producción
  - ✅ Puerto 3002 solo en desarrollo local (package.json script)

### 3. Package.json

- [ ] **Script `build` incluye `prisma generate`**
  - ✅ Ya configurado: `"build": "prisma generate && next build"`

- [ ] **Script `postinstall` configurado**
  - ✅ Ya configurado: `"postinstall": "prisma generate"`

- [ ] **Script `start` existe**
  - ✅ Ya configurado: `"start": "next start"`

### 4. Build Local

- [ ] **`npm install` funciona sin errores**
  ```bash
  npm install
  ```

- [ ] **`npm run build` funciona sin errores**
  ```bash
  npm run build
  ```
  
  **Nota**: Puede mostrar errores de tablas inexistentes, eso es normal si la BD está vacía.

### 5. Código

- [ ] **No hay referencias a puertos fijos en código**
  - Puerto 3002 solo en `package.json` para desarrollo local
  - Vercel maneja puertos automáticamente

- [ ] **No hay rutas hardcodeadas a localhost**
  - Verificar que no haya `http://localhost:3002` en el código
  - Usar rutas relativas o variables de entorno

- [ ] **next.config.js está correcto**
  - ✅ Ya optimizado con `swcMinify: true`

### 6. Git

- [ ] **Código commiteado y pusheado**
  ```bash
  git status  # Debe estar limpio
  git push origin main  # O tu rama principal
  ```

- [ ] **`.env` NO está en el repositorio**
  - ✅ Verificado: `.env` está en `.gitignore`
  - ✅ `.env.example` puede estar commiteado (sin valores reales)

### 7. Documentación

- [ ] **`.env.example` existe y está documentado**
  - Lista todas las variables necesarias
  - Sin valores reales, solo ejemplos

- [ ] **`VERCEL-DEPLOY.md` creado**
  - ✅ Ya creado con instrucciones completas

## 🚀 Pasos de Deploy

1. **Conectar repositorio en Vercel**
   - [ ] Ir a [vercel.com](https://vercel.com)
   - [ ] Importar proyecto desde Git

2. **Configurar variables de entorno**
   - [ ] Agregar `DATABASE_URL` en Settings → Environment Variables
   - [ ] Disponible en Production, Preview, Development

3. **Deploy inicial**
   - [ ] Click en "Deploy"
   - [ ] Esperar que termine el build (2-5 minutos)

4. **Migrar base de datos**
   - [ ] Ejecutar migraciones después del primer deploy:
     ```bash
     npx prisma migrate deploy
     ```

5. **Verificar funcionamiento**
   - [ ] Abrir la URL de Vercel
   - [ ] Probar login
   - [ ] Probar funcionalidades principales

## ⚠️ Problemas Comunes

### Error: "DATABASE_URL not found"
- **Solución**: Agregar variable en Vercel → Settings → Environment Variables

### Error: "Table does not exist"
- **Solución**: Ejecutar `npx prisma migrate deploy` después del deploy

### Error: "Prisma Client not generated"
- **Solución**: Verificar que `postinstall` está en `package.json` (✅ ya está)

### Error: Build timeout
- **Solución**: Revisar logs de build en Vercel para identificar dependencias pesadas

## 📝 Notas Importantes

- **SQLite vs PostgreSQL**: El proyecto está configurado para PostgreSQL. Si usas SQLite localmente, debes cambiar temporalmente el provider en `schema.prisma` solo para desarrollo local.

- **Puerto**: El puerto 3002 es solo para desarrollo local. Vercel maneja puertos automáticamente, no necesitas configurar nada.

- **Build Command**: Vercel detecta automáticamente Next.js, pero el build command incluye `prisma generate` para asegurar que Prisma Client se genere.

---

**Cuando completes todos los items de esta lista, estás listo para deploy en Vercel! 🎉**

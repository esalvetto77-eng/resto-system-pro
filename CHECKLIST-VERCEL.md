# Checklist para Deploy en Vercel

## ✅ Configuración Básica

- [x] `package.json` con todas las dependencias necesarias
  - [x] Next.js 14.0.4
  - [x] React 18.2.0
  - [x] React-DOM 18.2.0
  - [x] TypeScript y tipos (@types/react, @types/node, @types/react-dom)
  - [x] Prisma 5.22.0 (fijado sin ^)
  - [x] Tailwind CSS, PostCSS, Autoprefixer
  - [x] Lucide-react

- [x] Scripts en `package.json`
  - [x] `build`: `npx prisma generate && next build`
  - [x] `postinstall`: `npx prisma generate`
  - [x] Todos los scripts usan `npx prisma` (no `prisma` directo)

- [x] `tsconfig.json` configurado correctamente
  - [x] `moduleResolution: "bundler"` (mejor para Next.js)
  - [x] `baseUrl: "."`
  - [x] `paths: { "@/*": ["src/*", "./*"] }`

- [x] `next.config.js` con webpack aliases
  - [x] Alias para `@/components`
  - [x] Alias para `@/contexts`
  - [x] Alias para `@/lib`
  - [x] Extensiones `.tsx`, `.ts` configuradas

## ✅ Tipos e Interfaces

- [x] `DashboardStats` incluye `totalMensualSinIva?: number`
- [x] `ProductoDetailClientProps.inventario.ultimaActualizacion` es `Date` (no `string`)
- [x] Todas las interfaces están completas

## ✅ Archivos Críticos

- [x] `src/contexts/RestauranteContext.tsx` existe
- [x] `src/contexts/AuthContext.tsx` existe
- [x] `src/lib/utils.ts` existe con función `cn`
- [x] `components/guards/AdminOnly.tsx` existe
- [x] Todos los archivos de componentes en `components/` existen

## ✅ Prisma

- [x] `prisma/schema.prisma` usa PostgreSQL (`provider = "postgresql"`)
- [x] `DATABASE_URL` será configurada en Vercel (variables de entorno)

## 🔍 Verificación Pre-Deploy

Antes de hacer commit, ejecutar localmente:

```bash
npm run build
```

Si el build local funciona sin errores, el build en Vercel debería funcionar.

## 🚨 Errores Comunes Resueltos

1. ✅ "Cannot find module '@/contexts/RestauranteContext'"
   - Resuelto: `moduleResolution: "bundler"` + webpack aliases

2. ✅ "Property 'totalMensualSinIva' does not exist"
   - Resuelto: Agregado a interfaz `DashboardStats`

3. ✅ "Type 'Date' is not assignable to type 'string'"
   - Resuelto: Cambiado tipo de `ultimaActualizacion` a `Date`

4. ✅ "prisma: command not found"
   - Resuelto: Todos los scripts usan `npx prisma`

5. ✅ "No Next.js version detected"
   - Resuelto: Next.js en `dependencies` (no `devDependencies`)

6. ✅ "Cannot find module 'tailwindcss'"
   - Resuelto: Tailwind, PostCSS, Autoprefixer en `dependencies`

## 📝 Notas

- Si aparecen nuevos errores, verificar:
  1. ¿Existe el archivo?
  2. ¿Está el import correcto?
  3. ¿La interfaz/tipo está completa?
  4. ¿El archivo está en la ruta correcta (`src/` o raíz)?

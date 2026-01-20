# 🔧 Configurar DATABASE_URL en Vercel

## El Problema
Vercel/Supabase creó variables como `POSTGRES_PRISMA_URL` pero Prisma busca `DATABASE_URL`.

## Solución: Crear Variable DATABASE_URL

### Opción 1: Crear DATABASE_URL Apuntando a POSTGRES_PRISMA_URL (RECOMENDADO)

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Haz clic en **"Create new"** o el botón **"Add"** (arriba derecha)
3. En **Key**, escribe: `DATABASE_URL`
4. En **Value**, haz clic en el icono de ojo 👁️ junto a `POSTGRES_PRISMA_URL` para ver su valor
5. Copia el valor completo de `POSTGRES_PRISMA_URL`
6. Pégalo en el campo **Value** de `DATABASE_URL`
7. En **Environments**, selecciona **"All Environments"**
8. Click en **"Save"**

### Opción 2: Usar el Valor de POSTGRES_PRISMA_URL Directamente

Si prefieres, puedes usar el mismo valor que `POSTGRES_PRISMA_URL`:

1. Haz clic en el icono de ojo 👁️ junto a `POSTGRES_PRISMA_URL`
2. Copia el valor (verás algo como `postgresql://...`)
3. Sigue los pasos de la Opción 1 para crear `DATABASE_URL`

---

## Después de Crear DATABASE_URL

1. **Espera unos segundos** para que Vercel procese el cambio
2. **Haz un nuevo deploy** en Vercel (o espera al próximo automático)
3. **Sigue con los pasos siguientes** para crear tablas y usuarios

---

## ⚠️ NOTA IMPORTANTE

`POSTGRES_PRISMA_URL` ya está optimizada para Prisma. Al crear `DATABASE_URL` con el mismo valor, garantizamos compatibilidad con todas las partes de la aplicación.

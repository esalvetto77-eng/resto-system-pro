# 🔐 Solución Rápida: Crear Usuarios en Vercel

## El Problema
Los usuarios no existen en tu base de datos de producción en Vercel, por eso el login falla.

## Solución: Crear Usuarios Directamente

### Opción 1: Usar el Script Local (RECOMENDADO)

1. **Obtén tu DATABASE_URL de Vercel:**
   - Ve a https://vercel.com
   - Selecciona tu proyecto
   - Settings → Environment Variables
   - Copia el valor de `DATABASE_URL` (empieza con `postgresql://...`)

2. **Crea archivo `.env.local` en tu proyecto:**
   ```env
   DATABASE_URL=postgresql://usuario:password@host:puerto/database?schema=public
   ```
   ⚠️ Reemplaza con tu URL real de Vercel

3. **Ejecuta el script:**
   ```bash
   npx ts-node scripts/crear-usuarios-produccion.ts
   ```

4. **Verifica que funcionó:**
   Deberías ver:
   ```
   ✅ Usuario DUEÑO creado exitosamente
   ✅ Usuario ENCARGADO creado exitosamente
   ```

5. **Prueba el login:**
   - Email: `dueno@resto.com`
   - Contraseña: `123456`

---

### Opción 2: Crear Usuario desde Prisma Studio

1. **Configura DATABASE_URL** (igual que Opción 1, paso 1-2)

2. **Abre Prisma Studio:**
   ```bash
   npx prisma studio
   ```

3. **Crea usuarios manualmente:**
   - Abre http://localhost:5555
   - Ve a la tabla `Usuario`
   - Click en "Add record"
   - Completa:
     - nombre: `Dueño`
     - email: `dueno@resto.com`
     - password: (necesitas hashearla con bcrypt)
     - rol: `DUENO`
     - activo: `true`

   ⚠️ **Problema:** Necesitas hashear la contraseña. Mejor usa la Opción 1.

---

### Opción 3: Crear Usuario desde la API (si tienes acceso)

Si ya tienes un usuario admin, puedes crear usuarios desde la aplicación.

---

## Verificar que los Usuarios Existen

Después de crear los usuarios, puedes verificar accediendo a:
```
https://tu-app.vercel.app/api/auth/debug
```

Este endpoint muestra información del usuario actual (si estás logueado) o información de la base de datos.

---

## Credenciales por Defecto

Una vez creados los usuarios:

**👤 Usuario Dueño (Administrador):**
- Email: `dueno@resto.com`
- Contraseña: `123456`

**👤 Usuario Encargado:**
- Email: `encargado@resto.com`
- Contraseña: `123456`

---

## ⚠️ IMPORTANTE: Cambiar Contraseñas

Una vez que puedas iniciar sesión, **cambia estas contraseñas inmediatamente** por seguridad.

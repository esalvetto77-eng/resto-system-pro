# Credenciales de Usuarios de Prueba

## Usuarios Creados por `prisma/seed.ts`

Este es el seed principal configurado en `package.json`:

### 👤 Usuario Dueño (ADMIN/DUENO)
- **Email:** `dueno@resto.com`
- **Contraseña:** `123456`
- **Rol:** `DUENO` (Administrador con acceso completo)

### 👤 Usuario Encargado
- **Email:** `encargado@resto.com`
- **Contraseña:** `123456`
- **Rol:** `ENCARGADO` (Acceso limitado - solo crear ventas)

---

## Usuarios Creados por `prisma/seed-usuarios.ts`

Este es un seed alternativo que también puedes usar:

### 👤 Usuario Admin
- **Email:** `admin@restaurante.com`
- **Contraseña:** `admin123` (o el valor de `ADMIN_PASSWORD` en variables de entorno)
- **Rol:** `ADMIN` (Administrador)

### 👤 Usuario Encargado
- **Email:** `encargado@restaurante.com`
- **Contraseña:** `encargado123` (o el valor de `ENCARGADO_PASSWORD` en variables de entorno)
- **Rol:** `ENCARGADO`

---

## ¿Cómo crear los usuarios en producción (Vercel)?

Si los usuarios no existen en tu base de datos de producción, necesitas ejecutar el seed. Tienes varias opciones:

### Opción 1: Ejecutar seed localmente apuntando a la DB de producción

1. Obtén tu `DATABASE_URL` de producción desde Vercel
2. Configúrala temporalmente en un archivo `.env.local`:
   ```
   DATABASE_URL=postgresql://... (tu URL de Vercel)
   ```
3. Ejecuta:
   ```bash
   npx ts-node prisma/seed.ts
   ```

### Opción 2: Ejecutar seed desde un script de Node.js

Puedes crear un script temporal para crear usuarios directamente en producción.

### Opción 3: Crear usuarios manualmente desde la aplicación

Una vez que tengas acceso con un usuario admin, puedes crear más usuarios desde la interfaz.

---

## Nota Importante

**En producción, cambia estas contraseñas inmediatamente después del primer login.**

Para cambiar contraseñas, puedes:
1. Modificar el seed para usar contraseñas más seguras
2. Implementar una funcionalidad de cambio de contraseña en la aplicación
3. Crear nuevos usuarios con contraseñas seguras y eliminar los de prueba

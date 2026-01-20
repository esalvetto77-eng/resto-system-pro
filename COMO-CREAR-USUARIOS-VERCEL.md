# 🚀 Cómo Crear Usuarios en Vercel (Producción)

## Paso a Paso

### Paso 1: Obtener la URL de la Base de Datos de Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Busca la variable `DATABASE_URL`
5. **Copia el valor completo** (empieza con `postgresql://...`)

### Paso 2: Configurar la Variable de Entorno Localmente

1. En tu proyecto local, crea o edita el archivo `.env.local` en la raíz del proyecto
2. Agrega la `DATABASE_URL` de Vercel:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database?schema=public
```

⚠️ **IMPORTANTE:** Reemplaza con tu URL real de Vercel. No comitees este archivo (debe estar en `.gitignore`).

### Paso 3: Ejecutar el Script para Crear Usuarios

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
npx ts-node scripts/crear-usuarios-produccion.ts
```

### Paso 4: Verificar que Funcionó

Si todo salió bien, verás:

```
✅ Usuario DUEÑO creado exitosamente
   Email: dueno@resto.com
   Contraseña: 123456

✅ Usuario ENCARGADO creado exitosamente
   Email: encargado@resto.com
   Contraseña: 123456

🎉 Proceso completado!
```

### Paso 5: Probar el Login

Ve a tu aplicación en Vercel y prueba iniciar sesión con:

**Usuario Dueño:**
- Email: `dueno@resto.com`
- Contraseña: `123456`

**Usuario Encargado:**
- Email: `encargado@resto.com`
- Contraseña: `123456`

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:** Una vez que puedas iniciar sesión, **cambia estas contraseñas inmediatamente** desde la aplicación o crea usuarios nuevos con contraseñas seguras.

---

## 🆘 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
npm install
npx prisma generate
```

### Error: "Environment variable not found: DATABASE_URL"
Verifica que el archivo `.env.local` existe y tiene la variable `DATABASE_URL` correcta.

### Error de conexión a la base de datos
- Verifica que la `DATABASE_URL` esté correcta
- Verifica que la base de datos de Vercel esté activa
- Verifica que tu IP tenga acceso (algunos proveedores de DB requieren whitelist de IPs)

---

## ✅ Alternativa: Crear Usuario desde Prisma Studio

Si prefieres una interfaz gráfica:

1. Configura la `DATABASE_URL` en `.env.local` (como en el Paso 2)
2. Ejecuta:
```bash
npx prisma studio
```
3. Abre tu navegador en `http://localhost:5555`
4. Ve a la tabla `Usuario`
5. Crea nuevos usuarios manualmente (usa bcrypt para hashear las contraseñas)

# Solucionar Problema de Deploy en Vercel

## Problema
Vercel no está desplegando automáticamente los nuevos commits.

## Soluciones

### Opción 1: Deploy Manual desde Vercel (Más Rápido)

1. **Ve a tu proyecto en Vercel**: https://vercel.com
2. **Haz clic en "Deployments"** (Despliegues)
3. **Haz clic en el botón "..."** (tres puntos) en la parte superior derecha
4. **Selecciona "Redeploy"** o **"Redeploy"** del último deployment
5. **O haz clic en "Create Deployment"** → **"Deploy Latest Commit"**

Esto forzará un nuevo deploy con el código más reciente.

---

### Opción 2: Verificar Conexión GitHub-Vercel

1. **Ve a tu proyecto en Vercel**
2. **Ve a "Settings"** → **"Git"**
3. **Verifica que:**
   - El repositorio conectado sea: `esalvetto77-eng/resto-system-pro`
   - La rama sea: `main` (o `principal`)
   - Los webhooks estén activos

4. **Si no está conectado correctamente:**
   - Haz clic en **"Disconnect"**
   - Luego **"Connect Git Repository"**
   - Selecciona tu repositorio de GitHub
   - Conecta la rama `main`

---

### Opción 3: Verificar Webhooks de GitHub

1. **Ve a tu repositorio en GitHub**: https://github.com/esalvetto77-eng/resto-system-pro
2. **Ve a "Settings"** → **"Webhooks"**
3. **Verifica que haya un webhook de Vercel:**
   - URL debería ser algo como: `https://api.vercel.com/v1/integrations/deploy/...`
   - Estado debería ser "Active" (verde)
   - Eventos: "Just the push event"

4. **Si no existe el webhook:**
   - Vercel debería crearlo automáticamente al conectar el repositorio
   - Si no, reconecta el repositorio en Vercel (Opción 2)

---

### Opción 4: Deploy desde CLI de Vercel

Si tienes Vercel CLI instalado:

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Hacer login
vercel login

# Deploy manual
vercel --prod
```

---

### Opción 5: Verificar Build Settings

1. **Ve a tu proyecto en Vercel**
2. **Ve a "Settings"** → **"General"**
3. **Verifica "Build Command":**
   - Debería ser: `npm run vercel-build` o `npm run build`
4. **Verifica "Output Directory":**
   - Debería ser: `.next` (o dejar vacío para Next.js)

---

## Verificar que el Deploy Funcionó

Después de hacer el deploy:

1. **Espera 2-3 minutos** a que termine el build
2. **Verifica que el status sea "Ready"** (verde)
3. **Haz clic en el deployment** para ver los logs
4. **Verifica que no haya errores** en los logs

5. **Recarga tu aplicación:**
   - Ve a: `https://resto-system-pro-9ldp.vercel.app/proveedores/nuevo`
   - O edita un proveedor existente
   - Deberías ver el campo "Comentario"

---

## Si el Deploy Falla

1. **Revisa los logs del deployment** en Vercel
2. **Busca errores** relacionados con:
   - Prisma
   - Build errors
   - Dependencies

3. **Comparte el error** para poder ayudarte a solucionarlo

---

## Recomendación

**Usa la Opción 1 (Deploy Manual)** primero, es la más rápida y directa.

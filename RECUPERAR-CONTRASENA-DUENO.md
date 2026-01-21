# 🔐 Cómo Recuperar Contraseña del Dueño si la Olvidas

## ✅ Solución: Script Local

Si olvidas la contraseña del Dueño, puedes cambiarla usando el script local sin problemas.

---

## 📋 Pasos para Cambiar Contraseña del Dueño

### Paso 1: Configurar DATABASE_URL

Abre PowerShell en la raíz del proyecto y ejecuta:

```powershell
$env:DATABASE_URL="postgresql://postgres:KARfv0PtQ7Kzdl5r@db.bapptarixtynbrfjarfl.supabase.co:5432/postgres"
```

**O** si ya tienes `.env.local` con la DATABASE_URL, no necesitas este paso.

---

### Paso 2: Ejecutar el Script

En el mismo PowerShell, ejecuta:

```powershell
npx ts-node scripts/cambiar-contrasenas.ts
```

---

### Paso 3: Seguir las Instrucciones

El script te mostrará:

```
👥 Usuarios disponibles:
   1. Dueño (dueno@resto.com) - DUENO
   2. Encargado (encargado@resto.com) - ENCARGADO

Selecciona el número del usuario (o 0 para cambiar todos): 1

Nueva contraseña (mínimo 6 caracteres): [Ingresa tu nueva contraseña]
Confirma la contraseña: [Confirma la contraseña]

✅ Contraseña actualizada exitosamente
```

---

### Paso 4: Iniciar Sesión

1. Ve a tu aplicación en Vercel
2. Inicia sesión con el email del Dueño y la **nueva contraseña**
3. ✅ Listo

---

## 🔒 Seguridad

- ✅ Solo puedes cambiar contraseñas si tienes acceso local al proyecto
- ✅ Necesitas la DATABASE_URL correcta
- ✅ Funciona en cualquier momento
- ✅ No necesitas estar logueado para usar el script

---

## 💡 Consejos

1. **Guarda la contraseña nueva** en un gestor de contraseñas
2. **Usa una contraseña fuerte** (mínimo 12 caracteres, con letras y números)
3. **Guarda este script** - es tu método de recuperación

---

## ✅ Resumen

**Si olvidas la contraseña del Dueño:**
1. Ejecuta el script: `npx ts-node scripts/cambiar-contrasenas.ts`
2. Selecciona el usuario Dueño
3. Establece nueva contraseña
4. Inicia sesión con la nueva contraseña

**¡Es así de simple!** 🎉

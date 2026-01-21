# 🔐 Cómo Cambiar Contraseñas de Usuarios

Tienes **2 opciones** para cambiar las contraseñas:

---

## Opción 1: Script Local (Rápido y Directo) ⚡

### Paso 1: Configurar DATABASE_URL

Asegúrate de tener `DATABASE_URL` configurada en tu `.env.local` apuntando a la base de datos de producción:

```env
DATABASE_URL=postgresql://postgres:KARfv0PtQ7Kzdl5r@db.bapptarixtynbrfjarfl.supabase.co:5432/postgres
```

### Paso 2: Ejecutar el Script

En PowerShell, ejecuta:

```powershell
npx ts-node scripts/cambiar-contrasenas.ts
```

### Paso 3: Seguir las Instrucciones

El script te mostrará:
1. Lista de usuarios disponibles
2. Opción para cambiar uno o todos
3. Solicitará la nueva contraseña
4. Confirmará el cambio

**Ejemplo de uso:**
```
👥 Usuarios disponibles:
   1. Dueño (dueno@resto.com) - DUENO
   2. Encargado (encargado@resto.com) - ENCARGADO

Selecciona el número del usuario (o 0 para cambiar todos): 1

Nueva contraseña (mínimo 6 caracteres): MiNuevaPassword123!
Confirma la contraseña: MiNuevaPassword123!

✅ Contraseña actualizada exitosamente
```

---

## Opción 2: Desde la UI (Futuro) 🖥️

He creado un endpoint API (`/api/usuarios/[id]/cambiar-password`) que permite cambiar contraseñas desde la interfaz.

**Características:**
- ✅ Solo administradores pueden cambiar contraseñas de otros usuarios
- ✅ Los usuarios pueden cambiar su propia contraseña
- ✅ Validación de longitud (6-100 caracteres)
- ✅ Confirmación de contraseña requerida

**Para implementar en la UI:**
- Crear un componente de cambio de contraseña
- Conectar con el endpoint `/api/usuarios/[id]/cambiar-password`
- Agregar validación en el frontend

---

## 🔒 Recomendaciones de Contraseñas Seguras

### ✅ Contraseñas Fuertes:
- Mínimo **12 caracteres** (ideal 16+)
- Combinar **mayúsculas, minúsculas, números y símbolos**
- **No usar** información personal (nombre, email, etc.)
- **No usar** palabras comunes del diccionario
- **Única** para esta aplicación

### Ejemplos de Contraseñas Fuertes:
```
MiResto2024!Seguro
Rest@urante#2024$Fuerte
G3stion!Rest0@2024
```

### ❌ Contraseñas Débiles (NO usar):
```
123456
password
dueno123
resto2024
```

---

## 📋 Checklist de Seguridad

Después de cambiar las contraseñas:

- [ ] ✅ Contraseñas tienen mínimo 12 caracteres
- [ ] ✅ Contraseñas incluyen mayúsculas, minúsculas, números y símbolos
- [ ] ✅ Contraseñas son únicas (no reutilizadas)
- [ ] ✅ Contraseñas guardadas de forma segura (gestor de contraseñas)
- [ ] ✅ Usuarios pueden iniciar sesión con las nuevas contraseñas
- [ ] ✅ Contraseñas antiguas ya no funcionan

---

## 🚨 Importante

1. **No compartas las contraseñas** por email, chat o mensaje
2. **Usa un gestor de contraseñas** (1Password, LastPass, Bitwarden, etc.)
3. **Cambia las contraseñas periódicamente** (cada 3-6 meses)
4. **No uses la misma contraseña** en múltiples servicios

---

## ✅ Verificación

Después de cambiar las contraseñas:

1. **Cierra sesión** en la aplicación
2. **Inicia sesión** con la nueva contraseña
3. **Verifica** que funciona correctamente

---

## 🆘 Si Olvidaste la Contraseña

Si eres administrador y olvidaste tu contraseña:

1. Usa el script `cambiar-contrasenas.ts` para cambiarla
2. O contacta a otro administrador para que la cambie

**Nota:** Actualmente no hay recuperación automática de contraseña. Esto se puede implementar en el futuro si es necesario.

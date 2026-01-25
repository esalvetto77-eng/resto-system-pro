# Verificar Campo Comentario en Proveedores

## Pasos para Verificar

### 1. Verificar que el campo existe en la BD

Ejecuta este comando para verificar que la columna existe:

```bash
npx prisma db push
```

Si ya existe, debería decir "Already in sync" o similar.

### 2. Si estás en desarrollo local:

1. **Detén el servidor** (Ctrl+C en la terminal donde corre `npm run dev`)
2. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```
3. **Recarga la página** con **Ctrl+Shift+R** (hard refresh para limpiar cache)

### 3. Si estás en producción (Vercel):

1. **Verifica que el deploy se completó**:
   - Ve a https://vercel.com
   - Entra a tu proyecto
   - Verifica que el último deploy esté completo (debería mostrar el commit "Feat: Agregar campo comentario opcional a proveedores")

2. **Si el deploy no se inició automáticamente**:
   - Puedes hacer un push vacío para forzar el deploy:
   ```bash
   git commit --allow-empty -m "Trigger deploy"
   git push
   ```

3. **Espera a que termine el deploy** (generalmente 2-3 minutos)

4. **Recarga la página** con **Ctrl+Shift+R**

### 4. Verificar que el campo aparece:

1. Ve a **Proveedores** → **Nuevo Proveedor**
2. Deberías ver el campo **"Comentario"** después del campo **"Método de Pago"**
3. Es un textarea con placeholder: "Ej: Número para pedidos: 099123456..."

### 5. Si aún no aparece:

**Opción A: Verificar en la consola del navegador**
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Recarga la página
4. Busca errores relacionados con Prisma o el campo comentario

**Opción B: Verificar directamente en la BD**
Si tienes acceso a la base de datos, verifica que la columna existe:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'proveedores' 
AND column_name = 'comentario';
```

**Opción C: Forzar regeneración completa**
```bash
# Limpiar node_modules y regenerar
rm -rf node_modules/.prisma
npx prisma generate
npm run dev
```

## Ubicación del Campo

El campo "Comentario" debería aparecer:
- ✅ En el formulario de **crear proveedor** (`/proveedores/nuevo`)
- ✅ En el formulario de **editar proveedor** (`/proveedores/[id]/editar`)
- ✅ En la página de **detalle del proveedor** (`/proveedores/[id]`) - solo si tiene contenido

## Si el problema persiste

Comparte:
1. ¿Estás en desarrollo local o en producción (Vercel)?
2. ¿Qué error ves en la consola del navegador (F12)?
3. ¿El campo aparece en algún lugar pero no en otro?

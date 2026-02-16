# Solución de Vulnerabilidades de Seguridad en Supabase

## 📋 Resumen del Problema

Supabase detectó **25 vulnerabilidades de seguridad** en tu proyecto. Estas vulnerabilidades pueden permitir acceso no autorizado a tus datos.

## 🔍 Tipos de Vulnerabilidades Más Comunes

### 1. **Row Level Security (RLS) No Habilitado**
Las tablas están expuestas públicamente sin políticas de seguridad.

### 2. **Políticas de Seguridad Ausentes**
No hay políticas RLS configuradas en las tablas.

### 3. **Permisos de Base de Datos Demasiado Abiertos**
El usuario de la base de datos tiene permisos excesivos.

## ✅ Pasos para Resolver las Vulnerabilidades

### Paso 1: Revisar el Security Advisor de Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: **supabase-amber-kite**
3. Ve a **Security Advisor** (o haz clic en "View Security Advisor" en el email)
4. Revisa cada vulnerabilidad listada

### Paso 2: Habilitar Row Level Security (RLS)

Como estás usando **Prisma** (no el cliente de Supabase directamente), tienes dos opciones:

#### Opción A: Habilitar RLS desde Supabase Dashboard (Recomendado)

1. Ve a **Table Editor** en Supabase
2. Para cada tabla (`proveedores`, `productos`, `inventario`, `pedidos`, etc.):
   - Haz clic en la tabla
   - Ve a la pestaña **"Policies"**
   - Haz clic en **"Enable RLS"**
   - Crea políticas según tus necesidades

#### Opción B: Habilitar RLS con SQL

Ejecuta estos comandos en el **SQL Editor** de Supabase:

```sql
-- Habilitar RLS en todas las tablas principales
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;

-- Si tienes más tablas, agrega ALTER TABLE para cada una
```

### Paso 3: Crear Políticas de Seguridad

Como usas Prisma con conexión directa, necesitas políticas que permitan acceso desde tu aplicación. Crea políticas básicas:

```sql
-- Política para permitir todas las operaciones desde tu aplicación
-- (Ajusta según tus necesidades de seguridad)

-- Para proveedores
CREATE POLICY "Allow all operations for service role"
ON proveedores
FOR ALL
USING (true)
WITH CHECK (true);

-- Para productos
CREATE POLICY "Allow all operations for service role"
ON productos
FOR ALL
USING (true)
WITH CHECK (true);

-- Para inventario
CREATE POLICY "Allow all operations for service role"
ON inventario
FOR ALL
USING (true)
WITH CHECK (true);

-- Para pedidos
CREATE POLICY "Allow all operations for service role"
ON pedidos
FOR ALL
USING (true)
WITH CHECK (true);

-- Para item_pedido
CREATE POLICY "Allow all operations for service role"
ON item_pedido
FOR ALL
USING (true)
WITH CHECK (true);

-- Para producto_proveedor
CREATE POLICY "Allow all operations for service role"
ON producto_proveedor
FOR ALL
USING (true)
WITH CHECK (true);

-- Para empleados
CREATE POLICY "Allow all operations for service role"
ON empleados
FOR ALL
USING (true)
WITH CHECK (true);

-- Para asistencias
CREATE POLICY "Allow all operations for service role"
ON asistencias
FOR ALL
USING (true)
WITH CHECK (true);

-- Para incidentes
CREATE POLICY "Allow all operations for service role"
ON incidentes
FOR ALL
USING (true)
WITH CHECK (true);
```

**⚠️ IMPORTANTE**: Estas políticas permiten acceso completo. Si necesitas más seguridad, ajusta las políticas según tus roles de usuario.

### Paso 4: Verificar Variables de Entorno

Asegúrate de que las variables de entorno estén configuradas correctamente en Vercel:

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** > **Environment Variables**
3. Verifica que `DATABASE_URL` esté configurada correctamente
4. Asegúrate de que no haya credenciales expuestas en el código

### Paso 5: Revisar Permisos de Usuario de Base de Datos

1. En Supabase, ve a **Settings** > **Database**
2. Revisa los usuarios y sus permisos
3. Asegúrate de que el usuario que usa Prisma tenga solo los permisos necesarios

## 🔒 Mejores Prácticas de Seguridad

### 1. Usar Variables de Entorno
✅ Ya estás usando `.env` (está en `.gitignore`)

### 2. Autenticación en API Routes
Considera agregar autenticación a tus API routes:

```typescript
// Ejemplo en src/app/api/productos/route.ts
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  // Verificar autenticación
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  // ... resto del código
}
```

### 3. Validación de Inputs
✅ Ya estás validando en algunos lugares, pero considera usar Zod en todas las rutas

### 4. Rate Limiting
Considera agregar rate limiting a tus API routes para prevenir abusos.

## 📝 Checklist de Verificación

- [ ] Revisar Security Advisor en Supabase
- [ ] Habilitar RLS en todas las tablas
- [ ] Crear políticas de seguridad apropiadas
- [ ] Verificar variables de entorno en Vercel
- [ ] Revisar permisos de usuario de base de datos
- [ ] Verificar que no haya credenciales en el código
- [ ] Probar que la aplicación sigue funcionando después de los cambios

## 🚨 Si Algo No Funciona

Si después de habilitar RLS tu aplicación deja de funcionar:

1. **Verifica las políticas**: Asegúrate de que las políticas permitan las operaciones necesarias
2. **Revisa los logs**: Ve a Supabase > Logs para ver errores
3. **Prueba las consultas**: Usa el SQL Editor para probar las consultas directamente

## 📚 Recursos Adicionales

- [Documentación de RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Supabase Security Advisor](https://supabase.com/docs/guides/platform/security-advisor)

## ⚡ Acción Inmediata

1. **Haz clic en "View Security Advisor" en el email de Supabase**
2. **Revisa cada vulnerabilidad**
3. **Habilita RLS en todas las tablas**
4. **Crea políticas básicas** (puedes usar las del Paso 3)
5. **Verifica que todo funcione**

---

**Nota**: Si necesitas ayuda con políticas más específicas o autenticación, puedo ayudarte a implementarlas.

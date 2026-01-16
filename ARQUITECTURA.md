# Arquitectura del Sistema de Gestión de Restaurantes

## Visión General

Sistema web interno diseñado para la gestión operativa de restaurantes multi-sucursal, priorizando simplicidad operativa, claridad y escalabilidad.

## Principios de Diseño

### 1. Simplicidad Operativa
- Interfaz limpia y directa
- Operaciones comunes accesibles en pocos clics
- Formularios simples y rápidos
- No sobrecargar con funcionalidades innecesarias

### 2. Single Source of Truth
- Cada dato existe en un solo lugar
- Base de datos normalizada
- Relaciones bien definidas
- Sin redundancia de datos

### 3. Modularidad
- Módulos claramente separados
- Responsabilidades bien definidas
- Fácil mantenimiento y extensión
- Escalable por módulos

### 4. Escalabilidad
- Preparado para crecer desde el día uno
- Base de datos normalizada
- Código limpio y mantenible
- Estructura clara de carpetas

## Arquitectura Técnica

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 14)          │
│  - React 18                            │
│  - TypeScript                          │
│  - Tailwind CSS                        │
│  - App Router                          │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/REST API
               │
┌──────────────▼──────────────────────────┐
│      API Routes (Next.js API)          │
│  - Validación de datos                 │
│  - Lógica de negocio                   │
│  - Manejo de errores                   │
└──────────────┬──────────────────────────┘
               │
               │ Prisma Client
               │
┌──────────────▼──────────────────────────┐
│       Base de Datos (SQLite/Postgres)  │
│  - SQLite (desarrollo)                 │
│  - PostgreSQL (producción)             │
└─────────────────────────────────────────┘
```

### Estructura de Carpetas

```
restaurant-management-system/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes (Backend)
│   │   ├── proveedores/        # CRUD de Proveedores
│   │   ├── productos/          # CRUD de Productos
│   │   ├── inventario/         # Gestión de Inventario
│   │   ├── pedidos/            # Gestión de Pedidos
│   │   └── empleados/          # CRUD de Empleados
│   ├── proveedores/            # Páginas Frontend
│   │   ├── page.tsx           # Listado
│   │   ├── nuevo/             # Crear
│   │   └── [id]/              # Detalle/Editar
│   ├── productos/              # Similar estructura
│   ├── inventario/             # Página de Inventario
│   ├── pedidos/                # Gestión de Pedidos
│   ├── empleados/              # Gestión de Empleados
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página de inicio
│   └── globals.css             # Estilos globales
├── components/                  # Componentes React reutilizables
│   └── layout/
│       └── Navbar.tsx          # Navegación principal
├── lib/                         # Utilidades y configuraciones
│   ├── prisma.ts               # Cliente Prisma (singleton)
│   └── utils.ts                # Funciones auxiliares
├── prisma/                      # Configuración de Prisma
│   ├── schema.prisma           # Esquema de BD
│   └── seed.ts                 # Datos de ejemplo
└── public/                      # Archivos estáticos
```

## Diseño de Base de Datos

### Modelo de Datos

```
Proveedor (1) ────< (N) Producto
                │
                │
                └───< (N) Pedido ────< (N) ItemPedido ────> (1) Producto

Producto (1) ────< (1) Inventario

Empleado (1) ────< (N) Asistencia
         │
         └───< (N) Incidente
```

### Entidades Principales

#### 1. Proveedor
- **Propósito**: Almacenar información de proveedores y configuración de pedidos
- **Campos Clave**:
  - Datos de contacto (nombre, contacto, teléfono, email, dirección)
  - Configuración de pedidos (días, horarios)
  - Días de entrega
  - Estado activo/inactivo

#### 2. Producto
- **Propósito**: Catálogo de productos
- **Relaciones**: Pertenece a un Proveedor (N:1)
- **Campos Clave**:
  - Nombre, código, descripción
  - Unidad de medida
  - Stock mínimo
  - Precio de compra
  - Estado activo/inactivo

#### 3. Inventario
- **Propósito**: Stock actual de cada producto
- **Relaciones**: Relación 1:1 con Producto
- **Campos Clave**:
  - Stock actual (editable manualmente)
  - Última actualización
  - Estado calculado (OK/Reposición)

#### 4. Pedido
- **Propósito**: Pedidos a proveedores
- **Relaciones**: Pertenece a un Proveedor (N:1)
- **Campos Clave**:
  - Fechas (creación, pedido, entrega)
  - Estado (BORRADOR, ENVIADO, RECIBIDO, CANCELADO)
  - Observaciones

#### 5. ItemPedido
- **Propósito**: Items individuales de un pedido
- **Relaciones**: Pertenece a Pedido (N:1) y Producto (N:1)
- **Campos Clave**:
  - Cantidad sugerida (calculada)
  - Cantidad final (editable)
  - Precio unitario

#### 6. Empleado
- **Propósito**: Información de empleados
- **Campos Clave**:
  - Datos personales
  - Tipo de sueldo (MENSUAL/JORNAL)
  - Sueldo
  - Fechas (ingreso, baja)
  - Estado activo/inactivo

#### 7. Asistencia
- **Propósito**: Control de asistencia de empleados
- **Relaciones**: Pertenece a Empleado (N:1)
- **Campos Clave**:
  - Fecha
  - Hora entrada/salida
  - Observaciones

#### 8. Incidente
- **Propósito**: Registro de incidentes de empleados
- **Relaciones**: Pertenece a Empleado (N:1)
- **Campos Clave**:
  - Fecha
  - Tipo (FALTA, RETRASO, LLAMADO_ATENCION, OTRO)
  - Descripción
  - Severidad (LEVE, MODERADO, GRAVE)

### Decisiones de Diseño

1. **Inventario Separado de Producto**
   - Permite mantener historial de actualizaciones
   - Facilita futuras mejoras (historial de movimientos)
   - Stock mínimo en Producto, stock actual en Inventario

2. **Items de Pedido Separados**
   - Permite flexibilidad en la estructura de pedidos
   - Facilita cálculos y reportes
   - Historial de precios al momento del pedido

3. **Soft Deletes**
   - Los registros se marcan como inactivos
   - Preserva historial e integridad referencial
   - Permite reactivación si es necesario

## Flujo de Datos

### Flujo Típico: Generación de Pedidos

```
1. Usuario revisa Inventario
   ↓
2. Sistema calcula productos en reposición
   (stockActual < stockMinimo)
   ↓
3. Sistema agrupa por Proveedor
   ↓
4. Sistema calcula cantidades sugeridas
   (stockMinimo * 2 - stockActual)
   ↓
5. Usuario revisa y ajusta cantidades
   ↓
6. Usuario crea Pedido
   ↓
7. Sistema crea Pedido y ItemPedido
   ↓
8. Pedido queda en estado BORRADOR
```

### Flujo Típico: Actualización de Inventario

```
1. Usuario edita stock en Inventario
   ↓
2. Frontend envía PUT /api/inventario/[id]
   ↓
3. API actualiza stockActual
   ↓
4. Sistema actualiza ultimaActualizacion
   ↓
5. Frontend refresca la vista
   ↓
6. Sistema recalcula estado (OK/Reposición)
```

## API Design

### Convenciones

- **Rutas RESTful**: `/api/[recurso]` y `/api/[recurso]/[id]`
- **Métodos HTTP**:
  - GET: Lectura
  - POST: Creación
  - PUT: Actualización completa
  - DELETE: Eliminación (soft delete)
- **Respuestas JSON**: Siempre en formato JSON
- **Códigos de Estado**: HTTP estándar (200, 201, 400, 404, 500)

### Ejemplo de API Route

```typescript
// app/api/productos/route.ts
export async function GET(request: NextRequest) {
  // Listar productos
}

export async function POST(request: NextRequest) {
  // Crear producto
}
```

## Seguridad (Futuro)

### Consideraciones para Producción

1. **Autenticación**
   - NextAuth.js o similar
   - JWT tokens
   - Sesiones seguras

2. **Autorización**
   - Control de acceso por roles
   - Middleware de verificación
   - Validación de permisos

3. **Validación**
   - Zod para validación de esquemas
   - Sanitización de inputs
   - Validación en API routes

4. **HTTPS**
   - Obligatorio en producción
   - Certificados SSL

5. **Variables de Entorno**
   - Secrets en .env
   - Nunca commitear información sensible

## Escalabilidad

### Preparación para Crecimiento

1. **Base de Datos**
   - Migración fácil a PostgreSQL
   - Índices optimizados
   - Consultas eficientes

2. **Código**
   - Modular y reutilizable
   - Separación de concerns
   - Fácil de mantener

3. **Rendimiento**
   - Server Components de Next.js
   - Caching estratégico
   - Optimización de imágenes (futuro)

4. **Extensibilidad**
   - Nuevos módulos fáciles de agregar
   - API bien estructurada
   - Componentes reutilizables

## Mejoras Futuras

### Funcionalidades Potenciales

1. **Multi-sucursal**
   - Agregar entidad Sucursal
   - Inventario por sucursal
   - Reportes consolidados

2. **Reportes y Análisis**
   - Dashboard con métricas
   - Reportes de consumo
   - Análisis de costos

3. **Integraciones**
   - POS systems
   - Delivery platforms
   - Sistemas contables

4. **Notificaciones**
   - Alertas de stock bajo
   - Recordatorios de pedidos
   - Notificaciones de incidentes

5. **Historial y Auditoría**
   - Log de cambios
   - Historial de movimientos de inventario
   - Auditoría de acciones

## Consideraciones de Rendimiento

1. **Consultas Optimizadas**
   - Uso de índices
   - Selects específicos
   - Paginación cuando sea necesario

2. **Caching**
   - Caching de consultas frecuentes
   - Revalidación estratégica
   - Static Generation cuando sea posible

3. **Lazy Loading**
   - Carga diferida de componentes
   - Code splitting automático
   - Optimización de bundles

---

**Nota**: Esta arquitectura está diseñada para evolucionar. Los principios de simplicidad y modularidad facilitan futuras mejoras sin comprometer la estabilidad del sistema.

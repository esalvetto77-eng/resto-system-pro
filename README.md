# Sistema de Gestión de Restaurantes

Sistema web interno para la gestión operativa de restaurantes multi-sucursal. Diseñado con simplicidad operativa, claridad y escalabilidad como principios fundamentales.

## 📋 Características

### Módulos Principales

1. **Proveedores**
   - Gestión completa de datos de proveedores
   - Configuración de días y horarios de pedido
   - Configuración de días de entrega
   - Control de estado activo/inactivo

2. **Productos**
   - Catálogo de productos con relación a proveedores
   - Unidades de medida configurables
   - Stock mínimo por producto
   - Precios de compra
   - Control de estado activo/inactivo

3. **Inventario**
   - Stock actual editable manualmente
   - Estado automático (OK / Reposición)
   - Cálculo automático basado en stock mínimo
   - Actualización en tiempo real

4. **Pedidos**
   - Generación automática de pedidos por productos en reposición
   - Agrupación por proveedor
   - Cantidades sugeridas calculadas automáticamente
   - Cantidades finales editables antes de confirmar

5. **Empleados**
   - Gestión completa de datos de empleados
   - Tipo de sueldo (Mensual / Jornal)
   - Control de asistencia
   - Registro de incidentes
   - Historial de asistencias e incidentes

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **ORM:** Prisma
- **Validación:** Zod (preparado para futuras implementaciones)

### Estructura del Proyecto

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── proveedores/
│   │   ├── productos/
│   │   ├── inventario/
│   │   ├── pedidos/
│   │   └── empleados/
│   ├── proveedores/       # Páginas de Proveedores
│   ├── productos/         # Páginas de Productos
│   ├── inventario/        # Página de Inventario
│   ├── pedidos/           # Páginas de Pedidos
│   ├── empleados/         # Páginas de Empleados
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   └── layout/
│       └── Navbar.tsx     # Barra de navegación
├── lib/                   # Utilidades y configuraciones
│   ├── prisma.ts          # Cliente de Prisma
│   └── utils.ts           # Funciones de utilidad
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos de ejemplo
└── public/                # Archivos estáticos
```

### Arquitectura de Base de Datos

El sistema utiliza una base de datos normalizada con las siguientes entidades principales:

- **Proveedor**: Almacena información de proveedores y configuración de pedidos
- **Producto**: Catálogo de productos vinculado a proveedores
- **Inventario**: Stock actual de cada producto (relación 1:1 con Producto)
- **Pedido**: Pedidos a proveedores
- **ItemPedido**: Items individuales de un pedido
- **Empleado**: Información de empleados
- **Asistencia**: Registro de asistencias de empleados
- **Incidente**: Registro de incidentes de empleados

#### Principios de Diseño

1. **Single Source of Truth**: Cada dato existe en un solo lugar
2. **Normalización**: Base de datos normalizada para evitar redundancia
3. **Relaciones Claras**: Relaciones bien definidas entre entidades
4. **Soft Deletes**: Los registros se marcan como inactivos en lugar de eliminarse

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd restaurant-management-system
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear la base de datos y aplicar el esquema
npx prisma db push

# (Opcional) Poblar con datos de ejemplo
npm run db:seed
```

4. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

5. **Abrir en el navegador**

```
http://localhost:3000
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run db:generate` - Genera el cliente de Prisma
- `npm run db:push` - Aplica cambios al esquema de base de datos
- `npm run db:studio` - Abre Prisma Studio (interfaz visual de BD)
- `npm run db:seed` - Pobla la base de datos con datos de ejemplo

## 🔧 Configuración

### Variables de Entorno

Para producción, crear un archivo `.env` con:

```env
DATABASE_URL="file:./dev.db"  # SQLite para desarrollo
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname"  # PostgreSQL para producción
```

### Migración a PostgreSQL

1. Cambiar el provider en `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Actualizar la variable de entorno `DATABASE_URL`

3. Ejecutar migraciones:
```bash
npx prisma migrate dev
```

## 📖 Uso del Sistema

### Flujo de Trabajo Típico

1. **Configurar Proveedores**
   - Crear proveedores con sus datos de contacto
   - Configurar días y horarios de pedido
   - Configurar días de entrega

2. **Registrar Productos**
   - Crear productos vinculados a proveedores
   - Establecer stock mínimo por producto
   - Configurar precios de compra (opcional)

3. **Gestionar Inventario**
   - El sistema crea automáticamente registros de inventario al crear productos
   - Editar stock actual manualmente según necesidades
   - El sistema calcula automáticamente el estado (OK / Reposición)

4. **Generar Pedidos**
   - Ir a "Pedidos" > "Generar Pedidos Automáticos"
   - El sistema agrupa productos en reposición por proveedor
   - Revisar y ajustar cantidades sugeridas
   - Crear pedidos que quedan en estado "Borrador"

5. **Gestionar Empleados**
   - Registrar empleados con sus datos
   - Configurar tipo de sueldo y monto
   - Registrar asistencias e incidentes según sea necesario

## 🎨 Diseño y UX

### Principios de Diseño

- **Simplicidad**: Interfaz limpia y directa
- **Profesionalismo**: Estilo sobrio y gastronómico
- **Rapidez**: Diseñado para uso diario eficiente
- **Claridad**: Información clara y fácil de entender

### Paleta de Colores

- **Primario**: Rojo (#dc2626) - Tono gastronómico
- **Neutral**: Escala de grises para fondo y texto
- **Estados**: Verde (éxito), Amarillo (advertencia), Rojo (error)

## 🔐 Seguridad

### Consideraciones para Producción

1. **Autenticación**: Implementar autenticación antes de desplegar
2. **Autorización**: Agregar control de acceso por roles
3. **HTTPS**: Usar siempre HTTPS en producción
4. **Variables de Entorno**: Nunca commitear información sensible
5. **Validación**: Implementar validación en formularios (Zod ya está incluido)

## 📦 Despliegue

### Opciones de Despliegue

1. **Vercel** (Recomendado para Next.js)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Docker** (Para servidor propio)
   - Crear Dockerfile
   - Configurar PostgreSQL
   - Ejecutar migraciones en el contenedor

3. **Servidor VPS**
   - Instalar Node.js y PostgreSQL
   - Configurar variables de entorno
   - Usar PM2 para gestión de procesos

## 🔄 Migración desde Excel/Sheets

### Proceso Sugerido

1. **Exportar datos de Excel/Sheets**
   - Proveedores
   - Productos
   - Inventario actual
   - Empleados

2. **Importar datos**
   - Opción 1: Usar Prisma Studio para importación manual
   - Opción 2: Crear script de migración personalizado
   - Opción 3: Usar la API para importación masiva

3. **Validar datos**
   - Verificar integridad de relaciones
   - Confirmar stock actual
   - Revisar configuraciones

## 🛠️ Mantenimiento

### Tareas Regulares

- **Backup de Base de Datos**: Configurar backups automáticos
- **Actualizaciones**: Mantener dependencias actualizadas
- **Monitoreo**: Implementar logs y monitoreo de errores
- **Optimización**: Revisar rendimiento periódicamente

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribuciones

Este es un sistema interno, pero las mejoras son bienvenidas:

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y está diseñado para uso interno.

## 👤 Autor

Sistema diseñado para gestión operativa de restaurantes multi-sucursal.

---

**Nota**: Este sistema está diseñado para uso interno. Implementar autenticación y autorización antes de desplegar en producción.

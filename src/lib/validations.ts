// Esquemas de validación Zod para el sistema de gestión de restaurantes
import { z } from 'zod'

// Helper para transformar strings vacíos a null
const emptyStringToNull = z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional())

// Helper para convertir números de string a number
const stringToNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const num = parseFloat(val)
      return isNaN(num) ? null : num
    }
    return null
  },
  z.number().min(0).nullable().optional()
)

// Esquema para Proveedor
export const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo'),
  contacto: emptyStringToNull,
  telefono: emptyStringToNull,
  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email('Email inválido').max(200).nullable().optional().or(z.literal(''))
  ),
  direccion: emptyStringToNull,
  rubro: emptyStringToNull,
  minimoCompra: stringToNumber,
  metodoPago: emptyStringToNull,
  diasPedido: z.string().optional().default(JSON.stringify([])), // JSON string
  horarioPedido: z.preprocess((val) => (val === '' ? null : val), z.string().max(50).nullable().optional()),
  diasEntrega: z.string().optional().default(JSON.stringify([])), // JSON string
  activo: z.boolean().optional().default(true),
})

// Esquema para Producto
export const productoProveedorSchema = z.object({
  proveedorId: z.string().min(1, 'El proveedor es requerido'),
  precioCompra: z.number().min(0).nullable().optional(),
  ordenPreferencia: z.number().int().min(1).optional(),
})

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo'),
  codigo: z.string().max(100).nullable().optional(),
  descripcion: z.string().max(1000).nullable().optional(),
  unidad: z.string().min(1, 'La unidad es requerida').max(50),
  stockMinimo: z.number().min(0).default(0),
  rubro: z.string().max(100).nullable().optional(),
  stockInicial: z.number().min(0).optional().default(0),
  activo: z.boolean().optional().default(true),
  proveedores: z.array(productoProveedorSchema).min(1, 'Debe tener al menos un proveedor'),
  // Compatibilidad con formato antiguo
  proveedorId: z.string().optional(),
  precioCompra: z.number().optional(),
})

// Helper para convertir fechas (string o Date) a Date o null
const dateOrNull = z.preprocess(
  (val) => {
    if (!val || val === '') return null
    if (val instanceof Date) return val
    if (typeof val === 'string') {
      const date = new Date(val)
      return isNaN(date.getTime()) ? null : date
    }
    return null
  },
  z.date().nullable().optional()
)

// Esquema para Empleado
export const empleadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  apellido: z.string().min(1, 'El apellido es requerido').max(200),
  dni: z.preprocess((val) => (val === '' ? null : val), z.string().max(20).nullable().optional()),
  telefono: emptyStringToNull.max(50),
  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email('Email inválido').max(200).nullable().optional().or(z.literal(''))
  ),
  direccion: emptyStringToNull.max(500),
  tipoSueldo: z.enum(['MENSUAL', 'JORNAL', 'POR_HORA'], {
    errorMap: () => ({ message: 'Tipo de sueldo inválido. Debe ser MENSUAL, JORNAL o POR_HORA' }),
  }),
  sueldo: stringToNumber,
  valorHoraExtra: stringToNumber,
  valorHoraNormal: stringToNumber,
  fechaIngreso: dateOrNull,
  activo: z.boolean().optional().default(true),
  diasDescanso: z.preprocess((val) => (val === '' || val === null ? null : val), z.string().nullable().optional()),
  horarioEntrada: emptyStringToNull.max(10),
  horarioSalida: emptyStringToNull.max(10),
  carnetManipulacionEmision: dateOrNull,
  carnetManipulacionVencimiento: dateOrNull,
  carnetSaludEmision: dateOrNull,
  carnetSaludVencimiento: dateOrNull,
  cuentaBancaria: emptyStringToNull.max(100),
  nombreBanco: emptyStringToNull.max(200),
  cargo: emptyStringToNull.max(200),
  tipoRemuneracion: z.enum(['MENSUAL', 'JORNAL']).nullable().optional(),
  sueldoBaseMensual: stringToNumber,
  valorJornal: stringToNumber,
  ticketAlimentacion: z.boolean().optional().default(false),
  valorTicketDiario: stringToNumber,
  restauranteIds: z.array(z.string()).optional(),
})

// Esquema para Inventario
export const inventarioSchema = z.object({
  stockActual: z.number().min(0, 'El stock no puede ser negativo'),
})

// Esquema para Pedido
export const itemPedidoSchema = z.object({
  productoId: z.string().min(1, 'El producto es requerido'),
  cantidadSugerida: z.number().min(0),
  cantidadFinal: z.number().min(0),
  precioUnitario: z.number().min(0).nullable().optional(),
})

export const pedidoSchema = z.object({
  proveedorId: z.string().min(1, 'El proveedor es requerido'),
  fechaPedido: z.string().datetime().nullable().optional().or(z.date()).or(z.null()),
  fechaEntrega: z.string().datetime().nullable().optional().or(z.date()).or(z.null()),
  estado: z.enum(['BORRADOR', 'ENVIADO', 'RECIBIDO', 'CANCELADO']).optional().default('BORRADOR'),
  observaciones: z.string().max(2000).nullable().optional(),
  items: z.array(itemPedidoSchema).min(1, 'Debe tener al menos un item'),
})

// Esquemas de validación para actualizaciones (PUT) - campos opcionales
export const proveedorUpdateSchema = proveedorSchema.partial().required({ nombre: true })
export const productoUpdateSchema = productoSchema.partial().required({ nombre: true, unidad: true })
export const empleadoUpdateSchema = empleadoSchema.partial().required({ nombre: true, apellido: true, tipoSueldo: true })

// Esquema para Restaurante
export const restauranteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo'),
  ubicacion: emptyStringToNull.max(500),
  activo: z.boolean().optional().default(true),
})

export const restauranteUpdateSchema = restauranteSchema.partial().required({ nombre: true })

// Helper para validar y parsear datos
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

// Helper para formatear errores de Zod en mensajes legibles
export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}

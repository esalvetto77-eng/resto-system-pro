// API Route para Empleados - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los empleados (solo ADMIN)
export async function GET() {
  const user = await getCurrentUser()
  
  // Solo ADMIN puede ver empleados
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'No autorizado. Solo administradores pueden ver empleados.' },
      { status: 403 }
    )
  }
  try {
    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      include: {
        restaurantes: {
          include: {
            restaurante: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: 'asc' },
    })
    
    return NextResponse.json(empleados)
  } catch (error: any) {
    console.error('Error en GET /api/empleados:', error?.message || String(error))
    return NextResponse.json([])
  }
}

// POST: Crear un nuevo empleado (solo ADMIN)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Solo ADMIN puede crear empleados
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear empleados.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validaciones básicas
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!body.apellido || typeof body.apellido !== 'string' || body.apellido.trim() === '') {
      return NextResponse.json(
        { error: 'El apellido es requerido' },
        { status: 400 }
      )
    }

    if (!body.tipoSueldo || !['MENSUAL', 'JORNAL'].includes(body.tipoSueldo)) {
      return NextResponse.json(
        { error: 'El tipo de sueldo es requerido y debe ser MENSUAL o JORNAL' },
        { status: 400 }
      )
    }

    // Helper para convertir valores
    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    const toDateOrNull = (value: unknown): Date | null => {
      if (value === null || value === undefined || value === '') return null
      if (value instanceof Date) return value
      if (typeof value === 'string') {
        const parsed = new Date(value)
        return isNaN(parsed.getTime()) ? null : parsed
      }
      return null
    }

    // Crear empleado usando transacción
    const empleado = await prisma.$transaction(async (tx) => {
      // Crear el empleado
      const nuevoEmpleado = await tx.empleado.create({
        data: {
          nombre: body.nombre.trim(),
          apellido: body.apellido.trim(),
          dni: toStringOrNull(body.dni),
          telefono: toStringOrNull(body.telefono),
          email: toStringOrNull(body.email),
          direccion: toStringOrNull(body.direccion),
          tipoSueldo: body.tipoSueldo,
          sueldo: toNumberOrNull(body.sueldo),
          valorHoraExtra: toNumberOrNull(body.valorHoraExtra),
          valorHoraNormal: toNumberOrNull(body.valorHoraNormal),
          fechaIngreso: toDateOrNull(body.fechaIngreso) || new Date(),
          fechaBaja: toDateOrNull(body.fechaBaja),
          activo: body.activo !== undefined ? Boolean(body.activo) : true,
          diasDescanso: toStringOrNull(body.diasDescanso),
          horarioEntrada: toStringOrNull(body.horarioEntrada),
          horarioSalida: toStringOrNull(body.horarioSalida),
          carnetManipulacionEmision: toDateOrNull(body.carnetManipulacionEmision),
          carnetManipulacionVencimiento: toDateOrNull(body.carnetManipulacionVencimiento),
          carnetSaludEmision: toDateOrNull(body.carnetSaludEmision),
          carnetSaludVencimiento: toDateOrNull(body.carnetSaludVencimiento),
          cuentaBancaria: toStringOrNull(body.cuentaBancaria),
          nombreBanco: toStringOrNull(body.nombreBanco),
          cargo: toStringOrNull(body.cargo),
          tipoRemuneracion: body.tipoRemuneracion || null,
          sueldoBaseMensual: toNumberOrNull(body.sueldoBaseMensual),
          valorJornal: toNumberOrNull(body.valorJornal),
          ticketAlimentacion: body.ticketAlimentacion ?? false,
          valorTicketDiario: toNumberOrNull(body.valorTicketDiario),
        },
      })

      // Asignar restaurantes si se proporcionaron
      if (body.restauranteIds !== undefined && Array.isArray(body.restauranteIds) && body.restauranteIds.length > 0) {
        // Validar que todos los restaurantes existen
        for (const restauranteId of body.restauranteIds) {
          const restaurante = await tx.restaurante.findUnique({
            where: { id: restauranteId },
          })
          if (!restaurante) {
            throw new Error(`Restaurante ${restauranteId} no encontrado`)
          }
        }

        await tx.empleadoRestaurante.createMany({
          data: body.restauranteIds.map((restauranteId: string) => ({
            empleadoId: nuevoEmpleado.id,
            restauranteId,
          })),
        })
      }

      // Retornar empleado con restaurantes
      return await tx.empleado.findUnique({
        where: { id: nuevoEmpleado.id },
        include: {
          restaurantes: {
            include: {
              restaurante: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json(empleado, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/empleados:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear empleado'
    if (error?.message) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Ya existe un empleado con ese DNI'
      } else if (error.message.includes('PrismaClient')) {
        errorMessage = 'Error de conexión con la base de datos'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}

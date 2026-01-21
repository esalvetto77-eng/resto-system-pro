// API Route para operaciones individuales de Empleados - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un empleado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
      include: {
        asistencias: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        incidentes: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
        faltas: {
          orderBy: { fecha: 'desc' },
        },
        observaciones: {
          orderBy: { fecha: 'desc' },
        },
        suspensiones: {
          orderBy: { fechaInicio: 'desc' },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
        restaurantes: {
          include: {
            restaurante: {
              select: {
                id: true,
                nombre: true,
                ubicacion: true,
              },
            },
          },
        },
      },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(empleado)
  } catch (error: any) {
    console.error('Error en GET /api/empleados/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener empleado' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un empleado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Verificar que el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: params.id },
    })
    if (!empleadoExistente) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Helper para convertir valores
    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value
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

    // Actualizar empleado
    const empleado = await prisma.empleado.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        dni: toStringOrNull(body.dni),
        telefono: toStringOrNull(body.telefono),
        email: toStringOrNull(body.email),
        direccion: toStringOrNull(body.direccion),
        tipoSueldo: body.tipoSueldo,
        sueldo: toNumberOrNull(body.sueldo),
        valorHoraExtra: toNumberOrNull(body.valorHoraExtra),
        valorHoraNormal: toNumberOrNull(body.valorHoraNormal),
        fechaIngreso: toDateOrNull(body.fechaIngreso) || empleadoExistente.fechaIngreso,
        fechaBaja: toDateOrNull(body.fechaBaja),
        activo: body.activo ?? empleadoExistente.activo,
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

    // Actualizar restaurantes si se proporcionaron
    if (body.restauranteIds !== undefined) {
      const restauranteIds: string[] = Array.isArray(body.restauranteIds) ? body.restauranteIds : []
      
      await prisma.$transaction(async (tx) => {
        // Eliminar todas las relaciones existentes
        await tx.empleadoRestaurante.deleteMany({
          where: { empleadoId: params.id },
        })

        // Crear nuevas relaciones
        if (restauranteIds.length > 0) {
          await tx.empleadoRestaurante.createMany({
            data: restauranteIds.map((restauranteId) => ({
              empleadoId: params.id,
              restauranteId,
            })),
          })
        }
      })
    }

    // Retornar empleado con restaurantes actualizados
    const empleadoActualizado = await prisma.empleado.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(empleadoActualizado)
  } catch (error: any) {
    console.error('Error en PUT /api/empleados/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al actualizar empleado' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un empleado
// Si el usuario es ADMIN (dueño): hard delete (eliminación completa)
// Si no es ADMIN: soft delete (marcar como inactivo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener usuario actual desde la sesión
    const user = await getCurrentUser()
    const userIsAdmin = isAdmin(user)

    if (userIsAdmin) {
      // Hard delete: Eliminar completamente el empleado y sus relaciones
      await prisma.$transaction(async (tx) => {
        // Eliminar relaciones primero (por las foreign keys)
        await tx.empleadoRestaurante.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.asistencia.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.incidente.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.falta.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.observacionEmpleado.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.suspension.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.documentoEmpleado.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.ajusteTurno.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.calculoHoras.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.eventoMensual.deleteMany({
          where: { empleadoId: params.id },
        })
        await tx.liquidacionProfesional.deleteMany({
          where: { empleadoId: params.id },
        })

        // Finalmente eliminar el empleado
        await tx.empleado.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({ message: 'Empleado eliminado permanentemente' })
    } else {
      // Soft delete: Marcar como inactivo
      const empleado = await prisma.empleado.update({
        where: { id: params.id },
        data: {
          activo: false,
          fechaBaja: new Date(),
        },
      })

      return NextResponse.json(empleado)
    }
  } catch (error: any) {
    console.error('Error en DELETE /api/empleados/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar empleado' },
      { status: 500 }
    )
  }
}

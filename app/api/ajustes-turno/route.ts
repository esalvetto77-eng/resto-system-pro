// API Route para Ajustes de Turno
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar ajustes de turno
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empleadoId = searchParams.get('empleadoId')
    const restauranteId = searchParams.get('restauranteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    if (restauranteId) {
      where.restauranteId = restauranteId
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta)
        fechaHastaDate.setHours(23, 59, 59, 999)
        where.fecha.lte = fechaHastaDate
      }
    }

    const ajustes = await prisma.ajusteTurno.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(ajustes)
  } catch (error) {
    console.error('Error al obtener ajustes de turno:', error)
    return NextResponse.json(
      { error: 'Error al obtener ajustes de turno' },
      { status: 500 }
    )
  }
}

// POST: Crear un nuevo ajuste de turno
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.empleadoId || !body.restauranteId || !body.fecha || !body.tipoAjuste) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar que el empleado existe y pertenece al restaurante
    const empleado = await prisma.empleado.findUnique({
      where: { id: body.empleadoId },
      include: {
        restaurantes: {
          where: { restauranteId: body.restauranteId },
        },
      },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    if (empleado.restaurantes.length === 0) {
      return NextResponse.json(
        { error: 'El empleado no pertenece a este restaurante' },
        { status: 400 }
      )
    }

    // Validar tipo de ajuste
    const tiposValidos = ['horas_extra', 'falta', 'llegada_tarde', 'salida_anticipada', 'cambio_turno']
    if (!tiposValidos.includes(body.tipoAjuste)) {
      return NextResponse.json(
        { error: 'Tipo de ajuste inválido' },
        { status: 400 }
      )
    }

    // Para cambio_turno, se requiere horario personalizado (se manejará en el frontend)
    // Para otros tipos, minutosAfectados puede ser requerido
    if (body.tipoAjuste !== 'falta' && body.tipoAjuste !== 'cambio_turno' && body.minutosAfectados === undefined) {
      return NextResponse.json(
        { error: 'minutosAfectados es requerido para este tipo de ajuste' },
        { status: 400 }
      )
    }

    const ajuste = await prisma.ajusteTurno.create({
      data: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        fecha: new Date(body.fecha),
        tipoAjuste: body.tipoAjuste,
        minutosAfectados: body.minutosAfectados ?? null,
        observacion: body.observacion || null,
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(ajuste, { status: 201 })
  } catch (error) {
    console.error('Error al crear ajuste de turno:', error)
    return NextResponse.json(
      { error: 'Error al crear ajuste de turno' },
      { status: 500 }
    )
  }
}

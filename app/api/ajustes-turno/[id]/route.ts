// API Route para operaciones individuales de Ajustes de Turno
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Obtener un ajuste por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ajuste = await prisma.ajusteTurno.findUnique({
      where: { id: params.id },
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

    if (!ajuste) {
      return NextResponse.json(
        { error: 'Ajuste no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(ajuste)
  } catch (error) {
    console.error('Error al obtener ajuste:', error)
    return NextResponse.json(
      { error: 'Error al obtener ajuste' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un ajuste
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Verificar que el ajuste existe
    const ajusteExistente = await prisma.ajusteTurno.findUnique({
      where: { id: params.id },
    })

    if (!ajusteExistente) {
      return NextResponse.json(
        { error: 'Ajuste no encontrado' },
        { status: 404 }
      )
    }

    // Validar tipo de ajuste si se proporciona
    if (body.tipoAjuste) {
      const tiposValidos = ['horas_extra', 'falta', 'llegada_tarde', 'salida_anticipada', 'cambio_turno']
      if (!tiposValidos.includes(body.tipoAjuste)) {
        return NextResponse.json(
          { error: 'Tipo de ajuste inválido' },
          { status: 400 }
        )
      }
    }

    const ajuste = await prisma.ajusteTurno.update({
      where: { id: params.id },
      data: {
        ...(body.fecha && { fecha: new Date(body.fecha) }),
        ...(body.tipoAjuste && { tipoAjuste: body.tipoAjuste }),
        ...(body.minutosAfectados !== undefined && { minutosAfectados: body.minutosAfectados }),
        ...(body.observacion !== undefined && { observacion: body.observacion }),
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

    return NextResponse.json(ajuste)
  } catch (error) {
    console.error('Error al actualizar ajuste:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ajuste' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un ajuste
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ajuste = await prisma.ajusteTurno.findUnique({
      where: { id: params.id },
    })

    if (!ajuste) {
      return NextResponse.json(
        { error: 'Ajuste no encontrado' },
        { status: 404 }
      )
    }

    await prisma.ajusteTurno.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Ajuste eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar ajuste:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ajuste' },
      { status: 500 }
    )
  }
}

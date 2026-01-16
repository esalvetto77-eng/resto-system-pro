// API Route para operaciones individuales de Eventos Mensuales
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Obtener un evento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evento = await prisma.eventoMensual.findUnique({
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

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(evento)
  } catch (error) {
    console.error('Error al obtener evento:', error)
    return NextResponse.json(
      { error: 'Error al obtener evento' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un evento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Calcular monto si no viene
    let monto = body.monto || 0
    if (body.tipoEvento === 'HORAS_EXTRA' && body.cantidad && body.valorUnitario) {
      monto = body.cantidad * body.valorUnitario
    }

    const evento = await prisma.eventoMensual.update({
      where: { id: params.id },
      data: {
        mes: body.mes ? parseInt(body.mes) : undefined,
        anio: body.anio ? parseInt(body.anio) : undefined,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
        tipoEvento: body.tipoEvento,
        cantidad: body.cantidad !== undefined ? (body.cantidad ? parseFloat(body.cantidad) : null) : undefined,
        valorUnitario: body.valorUnitario !== undefined ? (body.valorUnitario ? parseFloat(body.valorUnitario) : null) : undefined,
        monto: parseFloat(monto),
        observacion: body.observacion !== undefined ? (body.observacion || null) : undefined,
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

    return NextResponse.json(evento)
  } catch (error) {
    console.error('Error al actualizar evento:', error)
    return NextResponse.json(
      { error: 'Error al actualizar evento' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.eventoMensual.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Evento eliminado' }, { status: 200 })
  } catch (error) {
    console.error('Error al eliminar evento:', error)
    return NextResponse.json(
      { error: 'Error al eliminar evento' },
      { status: 500 }
    )
  }
}

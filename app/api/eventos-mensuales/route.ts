// API Route para Eventos Mensuales
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: Listar eventos mensuales
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empleadoId = searchParams.get('empleadoId')
    const restauranteId = searchParams.get('restauranteId')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')
    const tipoEvento = searchParams.get('tipoEvento')

    const where: any = {}

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    if (restauranteId) {
      where.restauranteId = restauranteId
    }

    if (mes) {
      where.mes = parseInt(mes)
    }

    if (anio) {
      where.anio = parseInt(anio)
    }

    if (tipoEvento) {
      where.tipoEvento = tipoEvento
    }

    const eventos = await prisma.eventoMensual.findMany({
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
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(eventos)
  } catch (error) {
    console.error('Error al obtener eventos mensuales:', error)
    return NextResponse.json(
      { error: 'Error al obtener eventos mensuales' },
      { status: 500 }
    )
  }
}

// POST: Crear un nuevo evento mensual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.empleadoId || !body.restauranteId || !body.mes || !body.anio || !body.tipoEvento || !body.fecha) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Calcular monto si no viene
    let monto = body.monto || 0
    if (body.tipoEvento === 'HORAS_EXTRA' && body.cantidad && body.valorUnitario) {
      monto = body.cantidad * body.valorUnitario
    }

    const evento = await prisma.eventoMensual.create({
      data: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        mes: parseInt(body.mes),
        anio: parseInt(body.anio),
        fecha: new Date(body.fecha),
        tipoEvento: body.tipoEvento,
        cantidad: body.cantidad ? parseFloat(body.cantidad) : null,
        valorUnitario: body.valorUnitario ? parseFloat(body.valorUnitario) : null,
        monto: parseFloat(monto),
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

    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error('Error al crear evento mensual:', error)
    return NextResponse.json(
      { error: 'Error al crear evento mensual' },
      { status: 500 }
    )
  }
}

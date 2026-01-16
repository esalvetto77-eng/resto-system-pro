// API Route para faltas de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Listar faltas de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const faltas = await prisma.falta.findMany({
      where: { empleadoId: params.id },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(faltas)
  } catch (error) {
    console.error('Error al obtener faltas:', error)
    return NextResponse.json(
      { error: 'Error al obtener faltas' },
      { status: 500 }
    )
  }
}

// POST: Crear una nueva falta
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const falta = await prisma.falta.create({
      data: {
        empleadoId: params.id,
        fecha: new Date(body.fecha),
        justificada: body.justificada || false,
        motivo: body.motivo || null,
      },
    })

    return NextResponse.json(falta, { status: 201 })
  } catch (error) {
    console.error('Error al crear falta:', error)
    return NextResponse.json(
      { error: 'Error al crear falta' },
      { status: 500 }
    )
  }
}

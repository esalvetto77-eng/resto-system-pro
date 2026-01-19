// API Route para suspensiones de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar suspensiones de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const suspensiones = await prisma.suspension.findMany({
      where: { empleadoId: params.id },
      orderBy: { fechaInicio: 'desc' },
    })

    return NextResponse.json(suspensiones)
  } catch (error) {
    console.error('Error al obtener suspensiones:', error)
    return NextResponse.json(
      { error: 'Error al obtener suspensiones' },
      { status: 500 }
    )
  }
}

// POST: Crear una nueva suspensión
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const suspension = await prisma.suspension.create({
      data: {
        empleadoId: params.id,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: body.fechaFin ? new Date(body.fechaFin) : null,
        motivo: body.motivo,
      },
    })

    return NextResponse.json(suspension, { status: 201 })
  } catch (error) {
    console.error('Error al crear suspensión:', error)
    return NextResponse.json(
      { error: 'Error al crear suspensión' },
      { status: 500 }
    )
  }
}

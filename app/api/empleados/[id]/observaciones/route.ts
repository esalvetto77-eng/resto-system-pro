// API Route para observaciones de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar observaciones de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const observaciones = await prisma.observacionEmpleado.findMany({
      where: { empleadoId: params.id },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(observaciones)
  } catch (error) {
    console.error('Error al obtener observaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener observaciones' },
      { status: 500 }
    )
  }
}

// POST: Crear una nueva observación
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const observacion = await prisma.observacionEmpleado.create({
      data: {
        empleadoId: params.id,
        fecha: body.fecha ? new Date(body.fecha) : new Date(),
        titulo: body.titulo,
        descripcion: body.descripcion,
      },
    })

    return NextResponse.json(observacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear observación:', error)
    return NextResponse.json(
      { error: 'Error al crear observación' },
      { status: 500 }
    )
  }
}

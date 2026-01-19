// API Route para asistencias de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar asistencias de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const asistencias = await prisma.asistencia.findMany({
      where: { empleadoId: params.id },
      orderBy: { fecha: 'desc' },
      take: limit,
    })

    return NextResponse.json(asistencias)
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}

// POST: Crear una nueva asistencia
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const asistencia = await prisma.asistencia.create({
      data: {
        empleadoId: params.id,
        fecha: new Date(body.fecha),
        horaEntrada: body.horaEntrada
          ? new Date(body.horaEntrada)
          : null,
        horaSalida: body.horaSalida ? new Date(body.horaSalida) : null,
        observaciones: body.observaciones || null,
      },
    })

    return NextResponse.json(asistencia, { status: 201 })
  } catch (error) {
    console.error('Error al crear asistencia:', error)
    return NextResponse.json(
      { error: 'Error al crear asistencia' },
      { status: 500 }
    )
  }
}

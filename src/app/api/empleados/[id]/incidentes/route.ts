// API Route para incidentes de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar incidentes de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const incidentes = await prisma.incidente.findMany({
      where: { empleadoId: params.id },
      orderBy: { fecha: 'desc' },
      take: limit,
    })

    return NextResponse.json(incidentes)
  } catch (error) {
    console.error('Error al obtener incidentes:', error)
    return NextResponse.json(
      { error: 'Error al obtener incidentes' },
      { status: 500 }
    )
  }
}

// POST: Crear un nuevo incidente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const incidente = await prisma.incidente.create({
      data: {
        empleadoId: params.id,
        fecha: new Date(body.fecha),
        tipo: body.tipo,
        descripcion: body.descripcion,
        severidad: body.severidad || null,
      },
    })

    return NextResponse.json(incidente, { status: 201 })
  } catch (error) {
    console.error('Error al crear incidente:', error)
    return NextResponse.json(
      { error: 'Error al crear incidente' },
      { status: 500 }
    )
  }
}

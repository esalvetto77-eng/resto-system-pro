// API Route para operaciones individuales de Liquidaciones Profesionales
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener una liquidación por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const liquidacion = await prisma.liquidacionProfesional.findUnique({
      where: { id: params.id },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            cargo: true,
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

    if (!liquidacion) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(liquidacion)
  } catch (error) {
    console.error('Error al obtener liquidación:', error)
    return NextResponse.json(
      { error: 'Error al obtener liquidación' },
      { status: 500 }
    )
  }
}

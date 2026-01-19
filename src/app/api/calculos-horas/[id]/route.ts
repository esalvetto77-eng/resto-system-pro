// API Route para operaciones individuales de Cálculos de Horas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un cálculo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calculo = await prisma.calculoHoras.findUnique({
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

    if (!calculo) {
      return NextResponse.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(calculo)
  } catch (error) {
    console.error('Error al obtener cálculo:', error)
    return NextResponse.json(
      { error: 'Error al obtener liquidación' },
      { status: 500 }
    )
  }
}

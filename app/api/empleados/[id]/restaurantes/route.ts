// API Route para gestionar restaurantes de un empleado
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener restaurantes de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
      include: {
        restaurantes: {
          include: {
            restaurante: true,
          },
        },
      },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    const restaurantes = empleado.restaurantes.map((er) => er.restaurante)
    return NextResponse.json(restaurantes)
  } catch (error) {
    console.error('Error al obtener restaurantes del empleado:', error)
    return NextResponse.json(
      { error: 'Error al obtener restaurantes' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar restaurantes de un empleado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const restauranteIds: string[] = body.restauranteIds || []

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Usar transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // Eliminar todas las relaciones existentes
      await tx.empleadoRestaurante.deleteMany({
        where: { empleadoId: params.id },
      })

      // Crear nuevas relaciones
      if (restauranteIds.length > 0) {
        await tx.empleadoRestaurante.createMany({
          data: restauranteIds.map((restauranteId) => ({
            empleadoId: params.id,
            restauranteId,
          })),
        })
      }
    })

    // Retornar los restaurantes actualizados
    const empleadoActualizado = await prisma.empleado.findUnique({
      where: { id: params.id },
      include: {
        restaurantes: {
          include: {
            restaurante: true,
          },
        },
      },
    })

    const restaurantes = empleadoActualizado?.restaurantes.map(
      (er) => er.restaurante
    ) || []
    return NextResponse.json(restaurantes)
  } catch (error) {
    console.error('Error al actualizar restaurantes del empleado:', error)
    return NextResponse.json(
      { error: 'Error al actualizar restaurantes' },
      { status: 500 }
    )
  }
}

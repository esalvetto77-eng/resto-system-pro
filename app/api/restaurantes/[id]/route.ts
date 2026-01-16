// API Route para operaciones individuales de Restaurantes
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Obtener un restaurante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: params.id },
      include: {
        empleados: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    })

    if (!restaurante) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurante)
  } catch (error: any) {
    console.error('Error en GET /api/restaurantes/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener restaurante' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un restaurante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el restaurante existe
    const restauranteExistente = await prisma.restaurante.findUnique({
      where: { id: params.id },
    })
    if (!restauranteExistente) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    // Actualizar restaurante
    const restaurante = await prisma.restaurante.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre.trim(),
        ubicacion: toStringOrNull(body.ubicacion),
        activo: body.activo !== undefined ? Boolean(body.activo) : restauranteExistente.activo,
      },
    })

    return NextResponse.json(restaurante)
  } catch (error: any) {
    console.error('Error en PUT /api/restaurantes/[id]:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al actualizar restaurante', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un restaurante (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurante = await prisma.restaurante.update({
      where: { id: params.id },
      data: {
        activo: false,
      },
    })

    return NextResponse.json(restaurante)
  } catch (error: any) {
    console.error('Error en DELETE /api/restaurantes/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar restaurante' },
      { status: 500 }
    )
  }
}

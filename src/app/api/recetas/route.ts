// API Route para Recetas - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todas las recetas
export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      where: { activo: true },
      include: {
        ingredientes: {
          include: {
            producto: {
              include: {
                proveedores: {
                  include: {
                    proveedor: {
                      select: {
                        id: true,
                        nombre: true,
                      },
                    },
                  },
                  orderBy: {
                    ordenPreferencia: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(recetas)
  } catch (error: any) {
    console.error('Error en GET /api/recetas:', error?.message || String(error))
    return NextResponse.json([])
  }
}

// POST: Crear una nueva receta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Validar ingredientes
    if (!body.ingredientes || !Array.isArray(body.ingredientes) || body.ingredientes.length === 0) {
      return NextResponse.json(
        { error: 'La receta debe tener al menos un ingrediente' },
        { status: 400 }
      )
    }

    // Verificar que todos los productos existen
    for (const ing of body.ingredientes) {
      if (!ing.productoId) {
        return NextResponse.json(
          { error: 'Todos los ingredientes deben tener un productoId' },
          { status: 400 }
        )
      }
      const producto = await prisma.producto.findUnique({
        where: { id: ing.productoId },
      })
      if (!producto) {
        return NextResponse.json(
          { error: `Producto ${ing.productoId} no encontrado` },
          { status: 404 }
        )
      }
    }

    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    // Crear receta con ingredientes usando transacción
    const receta = await prisma.$transaction(async (tx) => {
      // Crear la receta
      const nuevaReceta = await tx.receta.create({
        data: {
          nombre: body.nombre.trim(),
          descripcion: toStringOrNull(body.descripcion),
          porciones: body.porciones || 1,
          categoria: toStringOrNull(body.categoria),
          instrucciones: toStringOrNull(body.instrucciones),
          activo: body.activo !== undefined ? Boolean(body.activo) : true,
        },
      })

      // Crear ingredientes
      await tx.recetaIngrediente.createMany({
        data: body.ingredientes.map((ing: any, index: number) => ({
          recetaId: nuevaReceta.id,
          productoId: ing.productoId,
          cantidad: parseFloat(ing.cantidad) || 0,
          orden: ing.orden !== undefined ? parseInt(ing.orden) : index,
          notas: toStringOrNull(ing.notas),
        })),
      })

      // Retornar receta con ingredientes
      return await tx.receta.findUnique({
        where: { id: nuevaReceta.id },
        include: {
          ingredientes: {
            include: {
              producto: {
                include: {
                  proveedores: {
                    include: {
                      proveedor: {
                        select: {
                          id: true,
                          nombre: true,
                        },
                      },
                    },
                    orderBy: {
                      ordenPreferencia: 'asc',
                    },
                  },
                },
              },
            },
            orderBy: {
              orden: 'asc',
            },
          },
        },
      })
    })

    return NextResponse.json(receta, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/recetas:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear receta'
    if (error?.message) {
      if (error.message.includes('PrismaClient')) {
        errorMessage = 'Error de conexión con la base de datos'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}

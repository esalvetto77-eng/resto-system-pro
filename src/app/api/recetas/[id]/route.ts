// API Route para operaciones individuales de Recetas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener una receta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const receta = await prisma.receta.findUnique({
      where: { id: params.id },
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
                        contacto: true,
                        telefono: true,
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

    if (!receta) {
      return NextResponse.json(
        { error: 'Receta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al obtener receta:', error)
    return NextResponse.json(
      { error: 'Error al obtener receta' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar una receta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Los ingredientes pueden venir como array para actualizar
    const ingredientes = body.ingredientes

    const receta = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos de la receta
      const recetaActualizada = await tx.receta.update({
        where: { id: params.id },
        data: {
          nombre: body.nombre,
          descripcion: body.descripcion || null,
          porciones: body.porciones || 1,
          categoria: body.categoria || null,
          instrucciones: body.instrucciones || null,
          activo: body.activo !== undefined ? body.activo : true,
        },
        include: {
          ingredientes: true,
        },
      })

      // Si se proporcionan ingredientes, actualizar relaciones
      if (ingredientes && Array.isArray(ingredientes)) {
        // Eliminar relaciones existentes
        await tx.recetaIngrediente.deleteMany({
          where: { recetaId: params.id },
        })

        // Crear nuevas relaciones
        if (ingredientes.length > 0) {
          await tx.recetaIngrediente.createMany({
            data: ingredientes.map((ing: any, index: number) => ({
              recetaId: params.id,
              productoId: ing.productoId,
              cantidad: ing.cantidad,
              orden: ing.orden || index,
              notas: ing.notas || null,
            })),
          })
        }
      }

      // Retornar receta con ingredientes actualizados
      return await tx.receta.findUnique({
        where: { id: params.id },
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

    return NextResponse.json(receta)
  } catch (error) {
    console.error('Error al actualizar receta:', error)
    return NextResponse.json(
      { error: 'Error al actualizar receta' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar una receta
// Si el usuario es ADMIN (dueño): hard delete (eliminación completa)
// Si no es ADMIN: soft delete (marcar como inactivo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener usuario actual desde la sesión
    const user = await getCurrentUser()
    const isAdmin = user?.rol === 'ADMIN'

    if (isAdmin) {
      // Hard delete: Eliminar completamente la receta y sus relaciones
      await prisma.$transaction(async (tx) => {
        // Eliminar relaciones primero (por las foreign keys)
        await tx.recetaIngrediente.deleteMany({
          where: { recetaId: params.id },
        })

        // Finalmente eliminar la receta
        await tx.receta.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({ message: 'Receta eliminada permanentemente' })
    } else {
      // Soft delete: Marcar como inactivo
      const receta = await prisma.receta.update({
        where: { id: params.id },
        data: { activo: false },
      })

      return NextResponse.json(receta)
    }
  } catch (error: any) {
    console.error('Error en DELETE /api/recetas/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar receta' },
      { status: 500 }
    )
  }
}

// API Route para operaciones individuales de Pedidos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener un pedido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: {
        proveedor: true,
        items: {
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
                  take: 1, // Solo el primer proveedor (preferido)
                },
              },
            },
          },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(pedido)
  } catch (error) {
    console.error('Error al obtener pedido:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedido' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const pedido = await prisma.$transaction(async (tx) => {
      // Actualizar pedido
      const pedidoActualizado = await tx.pedido.update({
        where: { id: params.id },
        data: {
          estado: body.estado,
          fechaPedido: body.fechaPedido ? new Date(body.fechaPedido) : null,
          fechaEntrega: body.fechaEntrega
            ? new Date(body.fechaEntrega)
            : null,
          observaciones: body.observaciones || null,
        },
      })

      // Actualizar items si se proporcionan
      if (body.items) {
        // Eliminar items existentes
        await tx.itemPedido.deleteMany({
          where: { pedidoId: params.id },
        })

        // Crear nuevos items
        if (body.items.length > 0) {
          await tx.itemPedido.createMany({
            data: body.items.map((item: any) => ({
              pedidoId: params.id,
              productoId: item.productoId,
              cantidadSugerida: item.cantidadSugerida || 0,
              cantidadFinal: item.cantidadFinal || 0,
              precioUnitario: item.precioUnitario || null,
            })),
          })
        }
      }

      return pedidoActualizado
    })

    return NextResponse.json(pedido)
  } catch (error) {
    console.error('Error al actualizar pedido:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Los items se eliminan automáticamente por cascade
    await prisma.pedido.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar pedido:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pedido' },
      { status: 500 }
    )
  }
}

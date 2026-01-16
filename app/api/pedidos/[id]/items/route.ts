// API Route para items de pedido
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT: Actualizar items de un pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Eliminar items existentes
    await prisma.itemPedido.deleteMany({
      where: { pedidoId: params.id },
    })

    // Crear nuevos items
    if (body.items && body.items.length > 0) {
      await prisma.itemPedido.createMany({
        data: body.items.map((item: any) => ({
          pedidoId: params.id,
          productoId: item.productoId,
          cantidadSugerida: item.cantidadSugerida || 0,
          cantidadFinal: item.cantidadFinal || item.cantidadSugerida || 0,
          precioUnitario: item.precioUnitario || null,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar items:', error)
    return NextResponse.json(
      { error: 'Error al actualizar items' },
      { status: 500 }
    )
  }
}

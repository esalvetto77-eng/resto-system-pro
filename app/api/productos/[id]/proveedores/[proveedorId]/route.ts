// API Route para operaciones individuales de proveedores de un producto
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT: Actualizar un proveedor de un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; proveedorId: string } }
) {
  try {
    const body = await request.json()

    const productoProveedor = await prisma.productoProveedor.update({
      where: {
        productoId_proveedorId: {
          productoId: params.id,
          proveedorId: params.proveedorId,
        },
      },
      data: {
        precioCompra: body.precioCompra !== undefined ? body.precioCompra : null,
        ordenPreferencia: body.ordenPreferencia,
      },
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
    })

    return NextResponse.json(productoProveedor)
  } catch (error) {
    console.error('Error al actualizar proveedor del producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proveedor del producto' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un proveedor de un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; proveedorId: string } }
) {
  try {
    await prisma.productoProveedor.delete({
      where: {
        productoId_proveedorId: {
          productoId: params.id,
          proveedorId: params.proveedorId,
        },
      },
    })

    return NextResponse.json({ message: 'Proveedor eliminado del producto' })
  } catch (error) {
    console.error('Error al eliminar proveedor del producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proveedor del producto' },
      { status: 500 }
    )
  }
}

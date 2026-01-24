// Página de detalle de Producto
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductoDetailPageClient } from './page-client'

export const dynamic = 'force-dynamic'

async function getProducto(id: string) {
  return await prisma.producto.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      descripcion: true,
      unidad: true,
      stockMinimo: true,
      rubro: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      proveedores: {
        select: {
          id: true,
          productoId: true,
          proveedorId: true,
          precioCompra: true,
          ordenPreferencia: true,
          createdAt: true,
          updatedAt: true,
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
      inventario: {
        select: {
          id: true,
          productoId: true,
          stockActual: true,
          ultimaActualizacion: true,
        },
      },
    },
  })
}

export default async function ProductoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const producto = await getProducto(params.id)

  if (!producto) {
    notFound()
  }

  return <ProductoDetailPageClient producto={producto} />
}

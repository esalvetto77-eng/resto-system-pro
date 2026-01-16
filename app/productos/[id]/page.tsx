// Página de detalle de Producto
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductoDetailPageClient } from './page-client'

export const dynamic = 'force-dynamic'

async function getProducto(id: string) {
  return await prisma.producto.findUnique({
    where: { id },
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
      inventario: true,
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

// Página de detalle de Proveedor
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProveedorDetailPageClient } from './page-client'

export const dynamic = 'force-dynamic'

async function getProveedor(id: string) {
  return await prisma.proveedor.findUnique({
    where: { id },
    include: {
      productos: {
        where: {
          producto: {
            activo: true,
          },
        },
        select: {
          id: true,
          precioCompra: true,
          producto: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              unidad: true,
              stockMinimo: true,
            },
          },
        },
        orderBy: {
          producto: {
            nombre: 'asc',
          },
        },
      },
    },
  })
}

export default async function ProveedorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const proveedor = await getProveedor(params.id)

  if (!proveedor) {
    notFound()
  }

  return <ProveedorDetailPageClient proveedor={proveedor} />
}

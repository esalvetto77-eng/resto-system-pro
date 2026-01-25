// Página de detalle de Proveedor
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProveedorDetailPageClient } from './page-client'

export const dynamic = 'force-dynamic'

async function getProveedor(id: string) {
  // Usar select explícito para evitar errores si el campo comentario no existe
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        contacto: true,
        telefono: true,
        email: true,
        direccion: true,
        diasPedido: true,
        horarioPedido: true,
        diasEntrega: true,
        activo: true,
        rubro: true,
        minimoCompra: true,
        metodoPago: true,
        createdAt: true,
        updatedAt: true,
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
    
    if (!proveedor) {
      return null
    }
    
    // Intentar obtener el comentario con SQL raw si el campo existe
    let comentario: string | null = null
    try {
      const resultado = await prisma.$queryRawUnsafe<Array<{comentario: string | null}>>(
        `SELECT comentario FROM proveedores WHERE id = $1`,
        id
      )
      if (resultado && resultado.length > 0) {
        comentario = resultado[0].comentario
      }
    } catch (error: any) {
      // Si el campo comentario no existe, simplemente usar null
      console.log('[PAGE PROVEEDOR] Campo comentario no existe aún, usando null')
    }
    
    // Agregar comentario al objeto
    return {
      ...proveedor,
      comentario,
    }
  } catch (error: any) {
    // Si falla, intentar sin select (incluir todos los campos)
    console.log('[PAGE PROVEEDOR] Error con select, intentando sin select:', error?.message)
    const proveedor = await prisma.proveedor.findUnique({
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
    
    if (!proveedor) {
      return null
    }
    
    // Si el proveedor no tiene comentario, agregarlo como null
    if (!('comentario' in proveedor) || proveedor.comentario === undefined) {
      return {
        ...proveedor,
        comentario: null,
      }
    }
    
    return proveedor
  }
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

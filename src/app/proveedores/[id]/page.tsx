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
    
    // Intentar obtener los campos adicionales con SQL raw si existen
    let comentario: string | null = null
    let numeroCuenta: string | null = null
    let banco: string | null = null
    try {
      const resultado = await prisma.$queryRawUnsafe<Array<{
        comentario: string | null,
        numero_cuenta: string | null,
        banco: string | null
      }>>(
        `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1`,
        id
      )
      if (resultado && resultado.length > 0) {
        comentario = resultado[0].comentario
        numeroCuenta = resultado[0].numero_cuenta
        banco = resultado[0].banco
      }
    } catch (error: any) {
      // Si los campos no existen, simplemente usar null
      console.log('[PAGE PROVEEDOR] Campos adicionales no existen aún, usando null')
    }
    
    // Agregar campos adicionales al objeto
    return {
      ...proveedor,
      comentario,
      numeroCuenta,
      banco,
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
    
    // Agregar campos adicionales si no existen
    let comentario: string | null = null
    let numeroCuenta: string | null = null
    let banco: string | null = null
    
    if ('comentario' in proveedor) {
      comentario = (proveedor as any).comentario || null
    }
    if ('numeroCuenta' in proveedor) {
      numeroCuenta = (proveedor as any).numeroCuenta || null
    }
    if ('banco' in proveedor) {
      banco = (proveedor as any).banco || null
    }
    
    // Si no están en el objeto, intentar obtenerlos con SQL
    if (comentario === null && numeroCuenta === null && banco === null) {
      try {
        const resultado = await prisma.$queryRawUnsafe<Array<{
          comentario: string | null,
          numero_cuenta: string | null,
          banco: string | null
        }>>(
          `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1`,
          id
        )
        if (resultado && resultado.length > 0) {
          comentario = resultado[0].comentario
          numeroCuenta = resultado[0].numero_cuenta
          banco = resultado[0].banco
        }
      } catch (error: any) {
        // Si los campos no existen, usar null
        console.log('[PAGE PROVEEDOR] Campos adicionales no existen aún, usando null')
      }
    }
    
    return {
      ...proveedor,
      comentario,
      numeroCuenta,
      banco,
    }
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

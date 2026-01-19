// API Route para Inventario - Versión simplificada
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todo el inventario
export async function GET() {
  try {
    const inventario = await prisma.inventario.findMany({
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
              take: 1,
            },
          },
        },
      },
      orderBy: {
        producto: {
          nombre: 'asc',
        },
      },
    })

    // Transformar la respuesta para que coincida con lo que espera el frontend
    const inventarioTransformado = inventario.map((item) => {
      const primerProveedor = item.producto.proveedores?.[0]
      return {
        id: item.id,
        productoId: item.productoId,
        stockActual: item.stockActual,
        ultimaActualizacion: item.ultimaActualizacion.toISOString(),
        producto: {
          id: item.producto.id,
          nombre: item.producto.nombre,
          codigo: item.producto.codigo,
          unidad: item.producto.unidad,
          stockMinimo: item.producto.stockMinimo,
          precioCompra: primerProveedor?.precioCompra || null,
          rubro: item.producto.rubro,
          proveedor: primerProveedor?.proveedor || null,
        },
      }
    })

    return NextResponse.json(inventarioTransformado)
  } catch (error: any) {
    console.error('Error en GET /api/inventario:', error?.message || String(error))
    return NextResponse.json([])
  }
}

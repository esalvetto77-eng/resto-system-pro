// API Route para generar pedidos automáticos
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularEstadoInventario } from '@/lib/utils.ts'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Generar lista de productos en reposición agrupados por proveedor
export async function GET() {
  try {
    // Obtener todos los productos activos con inventario
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
              take: 1, // Solo el primer proveedor (preferido)
            },
          },
        },
      },
    })

    // Filtrar productos activos en reposición
    const productosReposicion = inventario.filter((item) => {
      if (!item.producto || !item.producto.activo) return false
      return (
        calcularEstadoInventario(
          item.stockActual,
          item.producto.stockMinimo
        ) === 'REPOSICION'
      )
    })

    // Agrupar por proveedor
    const productosPorProveedor = productosReposicion.reduce(
      (acc, item) => {
        if (!item.producto) return acc
        // Obtener el primer proveedor (preferido) del producto
        const primerProveedor = item.producto.proveedores?.[0]?.proveedor
        if (!primerProveedor) return acc
        
        const proveedorId = primerProveedor.id
        if (!acc[proveedorId]) {
          acc[proveedorId] = {
            proveedor: primerProveedor,
            productos: [],
          }
        }
        // Calcular cantidad sugerida (2x el stock mínimo menos el actual)
        const cantidadSugerida = Math.max(
          0,
          item.producto.stockMinimo * 2 - item.stockActual
        )
        acc[proveedorId].productos.push({
          producto: item.producto,
          inventario: item,
          cantidadSugerida,
        })
        return acc
      },
      {} as Record<
        string,
        {
          proveedor: {
            id: string
            nombre: string
          }
          productos: Array<{
            producto: {
              id: string
              nombre: string
              activo: boolean
              stockMinimo: number
            }
            inventario: {
              id: string
              stockActual: number
            }
            cantidadSugerida: number
          }>
        }
      >
    )

    return NextResponse.json(Object.values(productosPorProveedor))
  } catch (error) {
    console.error('Error al generar pedidos automáticos:', error)
    return NextResponse.json(
      { error: 'Error al generar pedidos automáticos' },
      { status: 500 }
    )
  }
}

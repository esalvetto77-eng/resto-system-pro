// API Route para Inventario - Versión simplificada
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todo el inventario
export async function GET() {
  try {
    console.log('[API INVENTARIO] Obteniendo inventario...')
    
    // Usar select explícito para evitar leer campos que no existen
    let inventario = await prisma.inventario.findMany({
      select: {
        id: true,
        productoId: true,
        stockActual: true,
        ultimaActualizacion: true,
        producto: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            unidad: true,
            stockMinimo: true,
            rubro: true,
            proveedores: {
              select: {
                id: true,
                productoId: true,
                proveedorId: true,
                precioCompra: true,
                ordenPreferencia: true,
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
    
    console.log('[API INVENTARIO] Items encontrados:', inventario.length)
    
    // Verificar si hay productos activos sin registro de inventario y crearlos
    const productosActivos = await prisma.producto.findMany({
      where: { activo: true },
      select: { id: true },
    })
    
    const productosConInventario = new Set(inventario.map(item => item.productoId))
    const productosSinInventario = productosActivos.filter(p => !productosConInventario.has(p.id))
    
    if (productosSinInventario.length > 0) {
      console.log('[API INVENTARIO] Creando registros de inventario para', productosSinInventario.length, 'productos')
      await prisma.inventario.createMany({
        data: productosSinInventario.map(p => ({
          productoId: p.id,
          stockActual: 0,
        })),
        skipDuplicates: true,
      })
      
      // Volver a obtener el inventario completo
      const inventarioCompleto = await prisma.inventario.findMany({
        select: {
          id: true,
          productoId: true,
          stockActual: true,
          ultimaActualizacion: true,
          producto: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              unidad: true,
              stockMinimo: true,
              rubro: true,
              proveedores: {
                select: {
                  id: true,
                  productoId: true,
                  proveedorId: true,
                  precioCompra: true,
                  ordenPreferencia: true,
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
      
      inventario = inventarioCompleto
      console.log('[API INVENTARIO] Inventario completo después de crear registros:', inventario.length)
    }

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

    console.log('[API INVENTARIO] Devolviendo', inventarioTransformado.length, 'items')
    return NextResponse.json(inventarioTransformado)
  } catch (error: any) {
    console.error('[API INVENTARIO] Error completo:', error)
    console.error('[API INVENTARIO] Error message:', error?.message || String(error))
    console.error('[API INVENTARIO] Error stack:', error?.stack)
    return NextResponse.json([])
  }
}

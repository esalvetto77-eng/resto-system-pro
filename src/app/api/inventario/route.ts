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

    // Intentar leer campos de moneda usando SQL directo si existen
    const proveedorIds = inventario
      .map(item => item.producto.proveedores?.[0]?.id)
      .filter((id): id is string => id !== undefined)
    
    let monedaData: Record<string, any> = {}
    
    if (proveedorIds.length > 0) {
      try {
        // Intentar leer campos de moneda si existen
        // Construir la lista de IDs para la consulta SQL
        const idsList = proveedorIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')
        const query = `
          SELECT 
            id,
            "moneda",
            "precioEnDolares",
            "precioEnPesos",
            "cotizacionUsada",
            "fechaCotizacion",
            "unidadCompra",
            "cantidadPorUnidadCompra"
          FROM "producto_proveedor"
          WHERE id IN (${idsList})
        `
        console.log('[API INVENTARIO] Intentando leer campos de moneda y presentación para', proveedorIds.length, 'proveedores')
        const result = await prisma.$queryRawUnsafe<Array<{
          id: string
          moneda?: string | null
          precioEnDolares?: number | null
          precioEnPesos?: number | null
          cotizacionUsada?: number | null
          fechaCotizacion?: Date | null
          unidadCompra?: string | null
          cantidadPorUnidadCompra?: number | null
        }>>(query)
        
        console.log('[API INVENTARIO] Resultados de moneda y presentación:', result.length, 'registros encontrados')
        
        // Crear un mapa de ID a datos de moneda y presentación
        result.forEach((row) => {
          monedaData[row.id] = {
            moneda: row.moneda || null,
            precioEnDolares: row.precioEnDolares || null,
            precioEnPesos: row.precioEnPesos || null,
            cotizacionUsada: row.cotizacionUsada || null,
            fechaCotizacion: row.fechaCotizacion ? row.fechaCotizacion.toISOString() : null,
            unidadCompra: row.unidadCompra || null,
            cantidadPorUnidadCompra: row.cantidadPorUnidadCompra || null,
          }
          console.log('[API INVENTARIO] Moneda para', row.id, ':', row.moneda, 'precioEnDolares:', row.precioEnDolares)
        })
      } catch (error: any) {
        // Si los campos no existen, simplemente continuar con valores null
        console.log('[API INVENTARIO] Campos de moneda no disponibles en BD:', error?.message)
        console.log('[API INVENTARIO] Error completo:', error)
      }
    }

    // Transformar la respuesta para que coincida con lo que espera el frontend
    const inventarioTransformado = inventario.map((item) => {
      const primerProveedor = item.producto.proveedores?.[0]
      const datosMoneda = primerProveedor?.id ? monedaData[primerProveedor.id] : null
      
      const productoTransformado = {
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
          // Campos de moneda (leídos desde BD si existen)
          moneda: datosMoneda?.moneda || null,
          precioEnDolares: datosMoneda?.precioEnDolares || null,
          precioEnPesos: datosMoneda?.precioEnPesos || null,
          cotizacionUsada: datosMoneda?.cotizacionUsada || null,
          fechaCotizacion: datosMoneda?.fechaCotizacion || null,
          // Campos de presentación
          unidadCompra: datosMoneda?.unidadCompra || null,
          cantidadPorUnidadCompra: datosMoneda?.cantidadPorUnidadCompra || null,
        },
      }
      
      // Log para debugging
      if (datosMoneda) {
        console.log('[API INVENTARIO] Producto', item.producto.nombre, '- Moneda:', datosMoneda.moneda, 'Precio USD:', datosMoneda.precioEnDolares)
      }
      
      return productoTransformado
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

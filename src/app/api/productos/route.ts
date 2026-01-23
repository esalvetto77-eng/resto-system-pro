// API Route para Productos - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los productos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const soloActivos = searchParams.get('activo') === 'true'
  try {
    console.log('[API PRODUCTOS] Iniciando consulta de productos...')
    console.log('[API PRODUCTOS] Solo activos:', soloActivos)
    
    // Primero hacer una consulta simple para verificar que hay productos
    const countProductos = await prisma.producto.count({
      where: soloActivos ? { activo: true } : {},
    })
    console.log('[API PRODUCTOS] Total productos en BD:', countProductos)
    
    // Intentar consulta simple primero (sin includes complejos)
    let productos
    try {
      productos = await prisma.producto.findMany({
        where: soloActivos ? { activo: true } : {},
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
          },
          inventario: true,
        },
        orderBy: { nombre: 'asc' },
      })
      console.log('[API PRODUCTOS] Productos encontrados con includes:', productos.length)
    } catch (includeError: any) {
      console.error('[API PRODUCTOS] Error con includes, intentando sin includes:', includeError)
      // Si falla con includes, intentar sin ellos
      productos = await prisma.producto.findMany({
        where: soloActivos ? { activo: true } : {},
        orderBy: { nombre: 'asc' },
      })
      console.log('[API PRODUCTOS] Productos encontrados sin includes:', productos.length)
      // Agregar arrays vacíos para proveedores e inventario
      productos = productos.map((p: any) => ({
        ...p,
        proveedores: [],
        inventario: null,
      }))
    }
    
    console.log('[API PRODUCTOS] Primer producto (ejemplo):', productos[0] ? {
      id: productos[0].id,
      nombre: productos[0].nombre,
      activo: productos[0].activo,
      proveedoresCount: productos[0].proveedores?.length || 0,
    } : 'No hay productos')
    
    // Asegurar que los campos nuevos tengan valores por defecto si son null (para productos antiguos)
    const productosConDefaults = productos.map(producto => ({
      ...producto,
      proveedores: producto.proveedores.map((pp: any) => ({
        ...pp,
        moneda: pp.moneda || 'UYU',
        precioEnDolares: pp.precioEnDolares ?? null,
        precioEnPesos: pp.precioEnPesos ?? (pp.moneda === 'UYU' || !pp.moneda ? pp.precioCompra : null),
        cotizacionUsada: pp.cotizacionUsada ?? null,
        fechaCotizacion: pp.fechaCotizacion ?? null,
      })),
    }))
    
    console.log('[API PRODUCTOS] Devolviendo productos:', productosConDefaults.length)
    return NextResponse.json(productosConDefaults)
  } catch (error: any) {
    console.error('[API PRODUCTOS] Error completo:', error)
    console.error('[API PRODUCTOS] Error message:', error?.message || String(error))
    console.error('[API PRODUCTOS] Error stack:', error?.stack)
    console.error('[API PRODUCTOS] Error name:', error?.name)
    
    // En caso de error, devolver array vacío para que no rompa el frontend
    return NextResponse.json([])
  }
}

// POST: Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!body.unidad || typeof body.unidad !== 'string' || body.unidad.trim() === '') {
      return NextResponse.json(
        { error: 'La unidad es requerida' },
        { status: 400 }
      )
    }

    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    // Crear producto usando transacción
    const producto = await prisma.$transaction(async (tx) => {
      // Crear el producto
      const nuevoProducto = await tx.producto.create({
        data: {
          nombre: body.nombre.trim(),
          codigo: toStringOrNull(body.codigo),
          descripcion: toStringOrNull(body.descripcion),
          unidad: body.unidad.trim(),
          stockMinimo: toNumberOrNull(body.stockMinimo) ?? 0,
          rubro: toStringOrNull(body.rubro),
          activo: body.activo !== undefined ? Boolean(body.activo) : true,
        },
      })

      // Crear registro de inventario inicial
      await tx.inventario.create({
        data: {
          productoId: nuevoProducto.id,
          stockActual: toNumberOrNull(body.stockInicial) ?? 0,
        },
      })

      // Si se proporcionan proveedores, crear relaciones
      if (body.proveedores !== undefined && Array.isArray(body.proveedores) && body.proveedores.length > 0) {
        // Validar que todos los proveedores existen
        for (const prov of body.proveedores) {
          if (!prov.proveedorId) continue
          const proveedor = await tx.proveedor.findUnique({
            where: { id: prov.proveedorId },
          })
          if (!proveedor) {
            throw new Error(`Proveedor ${prov.proveedorId} no encontrado`)
          }
        }

        // Obtener cotización actual del dólar
        let cotizacionActual = null
        try {
          const { obtenerCotizacionBROU } = await import('@/lib/utils')
          const cotizacionData = await obtenerCotizacionBROU()
          if (cotizacionData) {
            cotizacionActual = (cotizacionData.compra + cotizacionData.venta) / 2
          }
        } catch (err) {
          console.warn('No se pudo obtener cotización, se guardará sin conversión:', err)
        }

        await tx.productoProveedor.createMany({
          data: body.proveedores
            .filter((prov: any) => prov.proveedorId)
            .map((prov: any, index: number) => {
              const precio = toNumberOrNull(prov.precioCompra)
              const moneda = prov.moneda || 'UYU'
              
              // Calcular precios según la moneda
              let precioEnDolares = null
              let precioEnPesos = null
              
              if (precio) {
                if (moneda === 'USD') {
                  precioEnDolares = precio
                  precioEnPesos = cotizacionActual ? precio * cotizacionActual : null
                } else {
                  precioEnPesos = precio
                  precioEnDolares = cotizacionActual ? precio / cotizacionActual : null
                }
              }
              
              return {
                productoId: nuevoProducto.id,
                proveedorId: prov.proveedorId,
                precioCompra: precio,
                moneda: moneda,
                precioEnDolares: precioEnDolares,
                precioEnPesos: precioEnPesos,
                cotizacionUsada: cotizacionActual,
                fechaCotizacion: cotizacionActual ? new Date() : null,
                ordenPreferencia: prov.ordenPreferencia || index + 1,
              }
            }),
        })
      }

      // Retornar producto con proveedores e inventario
      return await tx.producto.findUnique({
        where: { id: nuevoProducto.id },
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
          },
          inventario: true,
        },
      })
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/productos:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear producto'
    if (error?.message) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Ya existe un producto con ese código'
      } else if (error.message.includes('PrismaClient')) {
        errorMessage = 'Error de conexión con la base de datos'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}

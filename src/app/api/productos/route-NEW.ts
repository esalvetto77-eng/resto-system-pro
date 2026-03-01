// API Route para Productos - REESCRITO DESDE CERO
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los productos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const soloActivos = searchParams.get('activo') === 'true'
  const proveedorId = searchParams.get('proveedorId')
  
  try {
    const whereClause: any = soloActivos ? { activo: true } : {}
    
    if (proveedorId) {
      whereClause.proveedores = {
        some: {
          proveedorId: proveedorId
        }
      }
    }
    
    const productos = await prisma.producto.findMany({
      where: whereClause,
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
      orderBy: {
        nombre: 'asc',
      },
    })

    return NextResponse.json(productos)
  } catch (error: any) {
    console.error('[API PRODUCTOS GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST: Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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

    // Crear producto usando transacción
    const producto = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto
      const nuevoProducto = await tx.producto.create({
        data: {
          nombre: body.nombre.trim(),
          codigo: body.codigo?.trim() || null,
          descripcion: body.descripcion?.trim() || null,
          unidad: body.unidad.trim(),
          stockMinimo: body.stockMinimo ?? 0,
          rubro: body.rubro?.trim() || null,
          activo: body.activo !== undefined ? Boolean(body.activo) : true,
        },
      })

      // 2. Crear registro de inventario inicial
      await tx.inventario.create({
        data: {
          productoId: nuevoProducto.id,
          stockActual: body.stockInicial ?? 0,
        },
      })

      // 3. Obtener cotización del dólar si hay productos en USD
      let cotizacionActual = null
      const tieneProductosUSD = body.proveedores?.some((p: any) => p.moneda === 'USD')
      if (tieneProductosUSD) {
        try {
          const { obtenerCotizacionBROU } = await import('@/lib/utils')
          const cotizacionData = await obtenerCotizacionBROU()
          if (cotizacionData) {
            cotizacionActual = (cotizacionData.compra + cotizacionData.venta) / 2
          }
        } catch (err) {
          console.warn('[API PRODUCTOS POST] No se pudo obtener cotización:', err)
        }
      }

      // 4. Procesar proveedores - SIMPLE Y DIRECTO
      if (body.proveedores && Array.isArray(body.proveedores) && body.proveedores.length > 0) {
        for (const prov of body.proveedores) {
          if (!prov.proveedorId) continue

          // Normalizar moneda - SIMPLE
          let moneda = 'UYU'
          if (prov.moneda === 'USD' || prov.moneda === 'UYU') {
            moneda = prov.moneda
          }

          // Calcular precios
          const precioCompra = prov.precioCompra ? Number(prov.precioCompra) : null
          let precioEnDolares = null
          let precioEnPesos = null

          if (moneda === 'USD' && precioCompra) {
            precioEnDolares = precioCompra
            precioEnPesos = cotizacionActual ? precioCompra * cotizacionActual : null
          } else if (moneda === 'UYU' && precioCompra) {
            precioEnPesos = precioCompra
          }

          // Calcular IVA
          let precioConIVA = null
          let precioSinIVA = null
          if (precioCompra && prov.tipoIVA) {
            const ivaDecimal = parseFloat(prov.tipoIVA) / 100
            if (prov.precioIngresadoConIVA) {
              precioSinIVA = precioCompra / (1 + ivaDecimal)
              precioConIVA = precioCompra
            } else {
              precioSinIVA = precioCompra
              precioConIVA = precioCompra * (1 + ivaDecimal)
            }
          }

          // USAR PRISMA.create() DIRECTAMENTE - SIMPLE
          await tx.productoProveedor.create({
            data: {
              productoId: nuevoProducto.id,
              proveedorId: prov.proveedorId,
              precioCompra: precioCompra,
              ordenPreferencia: prov.ordenPreferencia || 1,
              moneda: moneda, // SIEMPRE establecer explícitamente
              precioEnDolares: precioEnDolares,
              precioEnPesos: precioEnPesos,
              cotizacionUsada: moneda === 'USD' ? cotizacionActual : null,
              fechaCotizacion: moneda === 'USD' && cotizacionActual ? new Date() : null,
              unidadCompra: prov.unidadCompra?.trim() || null,
              cantidadPorUnidadCompra: prov.cantidadPorUnidadCompra ? Number(prov.cantidadPorUnidadCompra) : null,
              tipoIVA: prov.tipoIVA || null,
              precioIngresadoConIVA: prov.precioIngresadoConIVA || false,
              precioConIVA: precioConIVA,
              precioSinIVA: precioSinIVA,
            },
          })

          console.log('[API PRODUCTOS POST] ✅ Proveedor creado:', {
            proveedorId: prov.proveedorId,
            moneda: moneda
          })
        }
      }

      // 5. Retornar producto creado
      return await tx.producto.findUnique({
        where: { id: nuevoProducto.id },
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
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    console.error('[API PRODUCTOS POST] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

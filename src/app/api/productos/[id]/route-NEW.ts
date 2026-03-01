// API Route para operaciones individuales de Productos - REESCRITO DESDE CERO
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
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

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(producto)
  } catch (error: any) {
    console.error('[API PRODUCTO GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Actualizar producto usando transacción
    const producto = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del producto
      const productoActualizado = await tx.producto.update({
        where: { id: params.id },
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

      // 2. Obtener cotización del dólar si hay productos en USD
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
          console.warn('[API PRODUCTO PUT] No se pudo obtener cotización:', err)
        }
      }

      // 3. Procesar proveedores - SIMPLE Y DIRECTO
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

          // USAR PRISMA.upsert() DIRECTAMENTE - SIMPLE
          await tx.productoProveedor.upsert({
            where: {
              productoId_proveedorId: {
                productoId: params.id,
                proveedorId: prov.proveedorId,
              },
            },
            create: {
              productoId: params.id,
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
            update: {
              precioCompra: precioCompra,
              ordenPreferencia: prov.ordenPreferencia || 1,
              moneda: moneda, // SIEMPRE actualizar explícitamente
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

          console.log('[API PRODUCTO PUT] ✅ Proveedor guardado:', {
            proveedorId: prov.proveedorId,
            moneda: moneda
          })
        }
      }

      // 4. Retornar producto actualizado
      return await tx.producto.findUnique({
        where: { id: params.id },
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

    return NextResponse.json(producto)
  } catch (error: any) {
    console.error('[API PRODUCTO PUT] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.producto.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Producto eliminado' })
  } catch (error: any) {
    console.error('[API PRODUCTO DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

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
      select: {
        id: true,
        nombre: true,
        codigo: true,
        descripcion: true,
        unidad: true,
        stockMinimo: true,
        rubro: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        proveedores: {
          select: {
            id: true,
            productoId: true,
            proveedorId: true,
            precioCompra: true,
            ordenPreferencia: true,
            createdAt: true,
            updatedAt: true,
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
        inventario: {
          select: {
            id: true,
            productoId: true,
            stockActual: true,
            ultimaActualizacion: true,
          },
        },
      },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Leer campos adicionales usando SQL directo
    if (producto.proveedores.length > 0) {
      try {
        const proveedorIds = producto.proveedores.map(pp => pp.id)
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
            "cantidadPorUnidadCompra",
            "tipoIVA",
            "precioIngresadoConIVA",
            "precioConIVA",
            "precioSinIVA"
          FROM "producto_proveedor"
          WHERE id IN (${idsList})
        `
        const camposAdicionales = await prisma.$queryRawUnsafe<Array<{
          id: string
          moneda?: string | null
          precioEnDolares?: number | null
          precioEnPesos?: number | null
          cotizacionUsada?: number | null
          fechaCotizacion?: Date | null
          unidadCompra?: string | null
          cantidadPorUnidadCompra?: number | null
          tipoIVA?: string | null
          precioIngresadoConIVA?: boolean | null
          precioConIVA?: number | null
          precioSinIVA?: number | null
        }>>(query)
        
        const camposMap = new Map(camposAdicionales.map(c => [c.id, c]))
        
        const productoConCampos = {
          ...producto,
          proveedores: producto.proveedores.map(pp => ({
            ...pp,
            ...(camposMap.get(pp.id) || {}),
          })),
        }
        
        return NextResponse.json(productoConCampos)
      } catch (error) {
        return NextResponse.json(producto)
      }
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

          // Usar SQL directo para garantizar que moneda se guarde correctamente
          try {
            await tx.$executeRawUnsafe(`
              INSERT INTO producto_proveedor (
                id, "productoId", "proveedorId", "precioCompra", "ordenPreferencia",
                "moneda", "precioEnDolares", "precioEnPesos", "cotizacionUsada", "fechaCotizacion",
                "unidadCompra", "cantidadPorUnidadCompra",
                "tipoIVA", "precioIngresadoConIVA", "precioConIVA", "precioSinIVA",
                "createdAt", "updatedAt"
              )
              VALUES (
                gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
              )
              ON CONFLICT ("productoId", "proveedorId") DO UPDATE SET
                "precioCompra" = EXCLUDED."precioCompra",
                "ordenPreferencia" = EXCLUDED."ordenPreferencia",
                "moneda" = EXCLUDED."moneda",
                "precioEnDolares" = EXCLUDED."precioEnDolares",
                "precioEnPesos" = EXCLUDED."precioEnPesos",
                "cotizacionUsada" = EXCLUDED."cotizacionUsada",
                "fechaCotizacion" = EXCLUDED."fechaCotizacion",
                "unidadCompra" = EXCLUDED."unidadCompra",
                "cantidadPorUnidadCompra" = EXCLUDED."cantidadPorUnidadCompra",
                "tipoIVA" = EXCLUDED."tipoIVA",
                "precioIngresadoConIVA" = EXCLUDED."precioIngresadoConIVA",
                "precioConIVA" = EXCLUDED."precioConIVA",
                "precioSinIVA" = EXCLUDED."precioSinIVA",
                "updatedAt" = NOW()
            `,
              params.id,
              prov.proveedorId,
              precioCompra,
              prov.ordenPreferencia || 1,
              moneda, // MONEDA SIEMPRE EXPLÍCITA
              precioEnDolares,
              precioEnPesos,
              moneda === 'USD' ? cotizacionActual : null,
              moneda === 'USD' && cotizacionActual ? new Date() : null,
              prov.unidadCompra?.trim() || null,
              prov.cantidadPorUnidadCompra ? Number(prov.cantidadPorUnidadCompra) : null,
              prov.tipoIVA || null,
              prov.precioIngresadoConIVA || false,
              precioConIVA,
              precioSinIVA
            )
          } catch (error: any) {
            // Si falla por campos que no existen, crear solo con campos básicos + moneda
            if (error?.code === '42703' || error?.message?.includes('does not exist')) {
              await tx.$executeRawUnsafe(`
                INSERT INTO producto_proveedor (
                  id, "productoId", "proveedorId", "precioCompra", "ordenPreferencia",
                  "moneda", "precioEnDolares", "precioEnPesos", "cotizacionUsada", "fechaCotizacion",
                  "createdAt", "updatedAt"
                )
                VALUES (
                  gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
                )
                ON CONFLICT ("productoId", "proveedorId") DO UPDATE SET
                  "precioCompra" = EXCLUDED."precioCompra",
                  "ordenPreferencia" = EXCLUDED."ordenPreferencia",
                  "moneda" = EXCLUDED."moneda",
                  "precioEnDolares" = EXCLUDED."precioEnDolares",
                  "precioEnPesos" = EXCLUDED."precioEnPesos",
                  "cotizacionUsada" = EXCLUDED."cotizacionUsada",
                  "fechaCotizacion" = EXCLUDED."fechaCotizacion",
                  "updatedAt" = NOW()
              `,
                params.id,
                prov.proveedorId,
                precioCompra,
                prov.ordenPreferencia || 1,
                moneda, // MONEDA SIEMPRE EXPLÍCITA
                precioEnDolares,
                precioEnPesos,
                moneda === 'USD' ? cotizacionActual : null,
                moneda === 'USD' && cotizacionActual ? new Date() : null
              )
            } else {
              throw error
            }
          }
          
          // GARANTÍA FINAL: UPDATE directo de moneda
          await tx.$executeRawUnsafe(`
            UPDATE "producto_proveedor" 
            SET "moneda" = $1::text
            WHERE "productoId" = $2 AND "proveedorId" = $3
          `, moneda, params.id, prov.proveedorId)

          console.log('[API PRODUCTO PUT] ✅ Proveedor guardado:', {
            proveedorId: prov.proveedorId,
            moneda: moneda
          })
        }
      }

      // 4. Retornar producto actualizado (sin campos adicionales, se leerán después)
      return await tx.producto.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          nombre: true,
          codigo: true,
          descripcion: true,
          unidad: true,
          stockMinimo: true,
          rubro: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
          proveedores: {
            select: {
              id: true,
              productoId: true,
              proveedorId: true,
              precioCompra: true,
              ordenPreferencia: true,
              createdAt: true,
              updatedAt: true,
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
          inventario: {
            select: {
              id: true,
              productoId: true,
              stockActual: true,
              ultimaActualizacion: true,
            },
          },
        },
      })
    })

    // Leer campos adicionales después de la transacción
    if (producto && producto.proveedores.length > 0) {
      try {
        const proveedorIds = producto.proveedores.map(pp => pp.id)
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
            "cantidadPorUnidadCompra",
            "tipoIVA",
            "precioIngresadoConIVA",
            "precioConIVA",
            "precioSinIVA"
          FROM "producto_proveedor"
          WHERE id IN (${idsList})
        `
        const camposAdicionales = await prisma.$queryRawUnsafe<Array<{
          id: string
          moneda?: string | null
          precioEnDolares?: number | null
          precioEnPesos?: number | null
          cotizacionUsada?: number | null
          fechaCotizacion?: Date | null
          unidadCompra?: string | null
          cantidadPorUnidadCompra?: number | null
          tipoIVA?: string | null
          precioIngresadoConIVA?: boolean | null
          precioConIVA?: number | null
          precioSinIVA?: number | null
        }>>(query)
        
        const camposMap = new Map(camposAdicionales.map(c => [c.id, c]))
        
        const productoConCampos = {
          ...producto,
          proveedores: producto.proveedores.map(pp => ({
            ...pp,
            ...(camposMap.get(pp.id) || {}),
          })),
        }
        
        return NextResponse.json(productoConCampos)
      } catch (error) {
        return NextResponse.json(producto)
      }
    }
    
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

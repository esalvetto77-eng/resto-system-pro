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
      orderBy: {
        nombre: 'asc',
      },
    })
    
    // Leer campos adicionales usando SQL directo
    const productosConCamposAdicionales = await Promise.all(
      productos.map(async (producto) => {
        if (producto.proveedores.length === 0) return producto
        
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
          
          return {
            ...producto,
            proveedores: producto.proveedores.map(pp => ({
              ...pp,
              ...(camposMap.get(pp.id) || {}),
            })),
          }
        } catch (error) {
          // Si falla, devolver sin campos adicionales
          return producto
        }
      })
    )

    return NextResponse.json(productosConCamposAdicionales)
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

    // Verificar qué campos existen ANTES de la transacción
    let camposMonedaExisten = false
    let camposPresentacionExisten = false
    let camposIVAExisten = false
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "moneda" FROM "producto_proveedor" LIMIT 1`)
      camposMonedaExisten = true
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        camposMonedaExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "unidadCompra" FROM "producto_proveedor" LIMIT 1`)
      camposPresentacionExisten = true
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        camposPresentacionExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "tipoIVA" FROM "producto_proveedor" LIMIT 1`)
      camposIVAExisten = true
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        camposIVAExisten = false
      }
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

          // Construir SQL dinámicamente según qué campos existen
          let camposSQL = '"productoId", "proveedorId", "precioCompra", "ordenPreferencia"'
          let valoresSQL = '$1, $2, $3, $4'
          let params: any[] = [nuevoProducto.id, prov.proveedorId, precioCompra, prov.ordenPreferencia || 1]
          let paramIndex = 5

          if (camposMonedaExisten) {
            camposSQL += ', "moneda", "precioEnDolares", "precioEnPesos", "cotizacionUsada", "fechaCotizacion"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}`
            params.push(moneda, precioEnDolares, precioEnPesos, moneda === 'USD' ? cotizacionActual : null, moneda === 'USD' && cotizacionActual ? new Date() : null)
            paramIndex += 5
          }

          if (camposPresentacionExisten) {
            camposSQL += ', "unidadCompra", "cantidadPorUnidadCompra"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}`
            params.push(prov.unidadCompra?.trim() || null, prov.cantidadPorUnidadCompra ? Number(prov.cantidadPorUnidadCompra) : null)
            paramIndex += 2
          }

          if (camposIVAExisten) {
            camposSQL += ', "tipoIVA", "precioIngresadoConIVA", "precioConIVA", "precioSinIVA"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}`
            params.push(prov.tipoIVA || null, prov.precioIngresadoConIVA || false, precioConIVA, precioSinIVA)
            paramIndex += 4
          }

          // INSERT solo con campos que existen
          await tx.$executeRawUnsafe(`
            INSERT INTO producto_proveedor (
              id, ${camposSQL}, "createdAt", "updatedAt"
            )
            VALUES (
              gen_random_uuid()::text, ${valoresSQL}, NOW(), NOW()
            )
          `, ...params)

          // GARANTÍA FINAL: UPDATE directo de moneda si existe
          if (camposMonedaExisten) {
            await tx.$executeRawUnsafe(`
              UPDATE "producto_proveedor" 
              SET "moneda" = $1::text
              WHERE "productoId" = $2 AND "proveedorId" = $3
            `, moneda, nuevoProducto.id, prov.proveedorId)
          }

          console.log('[API PRODUCTOS POST] ✅ Proveedor creado:', {
            proveedorId: prov.proveedorId,
            moneda: moneda
          })
        }
      }

      // 5. Retornar producto creado (sin campos adicionales, se leerán después)
      return await tx.producto.findUnique({
        where: { id: nuevoProducto.id },
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
        
        return NextResponse.json(productoConCampos, { status: 201 })
      } catch (error) {
        return NextResponse.json(producto, { status: 201 })
      }
    }
    
    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    console.error('[API PRODUCTOS POST] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

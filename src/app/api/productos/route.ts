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
  const proveedorId = searchParams.get('proveedorId')
  try {
    console.log('[API PRODUCTOS] Iniciando consulta de productos...')
    console.log('[API PRODUCTOS] Solo activos:', soloActivos)
    console.log('[API PRODUCTOS] Proveedor ID:', proveedorId)
    
    // Construir el where clause
    const whereClause: any = soloActivos ? { activo: true } : {}
    
    // Si hay un proveedorId, filtrar productos que tengan ese proveedor
    if (proveedorId) {
      whereClause.proveedores = {
        some: {
          proveedorId: proveedorId
        }
      }
    }
    
    // Primero hacer una consulta simple para verificar que hay productos
    const countProductos = await prisma.producto.count({
      where: whereClause,
    })
    console.log('[API PRODUCTOS] Total productos en BD:', countProductos)
    
    // Usar select explícito para evitar leer campos que no existen
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
      orderBy: { nombre: 'asc' },
    })
    console.log('[API PRODUCTOS] Productos encontrados:', productos.length)
    
    // Intentar leer campos de moneda y presentación usando SQL directo si existen
    const proveedorIds = productos
      .flatMap(p => p.proveedores.map(pp => pp.id))
      .filter((id): id is string => id !== undefined)
    
    let monedaData: Record<string, any> = {}
    
    if (proveedorIds.length > 0) {
      try {
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
        const result = await prisma.$queryRawUnsafe<Array<{
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
        
        console.log('[API PRODUCTOS] Resultados de moneda, presentación e IVA:', result.length, 'registros encontrados')
        result.forEach((row) => {
          monedaData[row.id] = {
            moneda: row.moneda || null,
            precioEnDolares: row.precioEnDolares || null,
            precioEnPesos: row.precioEnPesos || null,
            cotizacionUsada: row.cotizacionUsada || null,
            fechaCotizacion: row.fechaCotizacion ? row.fechaCotizacion.toISOString() : null,
            unidadCompra: row.unidadCompra || null,
            cantidadPorUnidadCompra: row.cantidadPorUnidadCompra || null,
            tipoIVA: row.tipoIVA || null,
            precioIngresadoConIVA: row.precioIngresadoConIVA || false,
            precioConIVA: row.precioConIVA || null,
            precioSinIVA: row.precioSinIVA || null,
          }
          if (row.moneda === 'USD' || row.precioEnDolares) {
            console.log('[API PRODUCTOS] Producto en USD encontrado:', row.id, {
              moneda: row.moneda,
              precioEnDolares: row.precioEnDolares,
              precioEnPesos: row.precioEnPesos
            })
          }
        })
      } catch (error: any) {
        // Si los campos no existen, es normal - el usuario necesita ejecutar npx prisma db push
        if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
          console.log('[API PRODUCTOS] Campos de moneda/presentación no existen en BD. Ejecuta: npx prisma db push')
        } else {
          console.log('[API PRODUCTOS] Error al leer campos de moneda/presentación:', error?.message)
          console.log('[API PRODUCTOS] Error completo:', error)
        }
      }
    }
    
    // Agregar información de moneda y presentación a cada proveedor
    const productosConMoneda = productos.map(producto => ({
      ...producto,
      proveedores: producto.proveedores.map(pp => {
        const datosMoneda = monedaData[pp.id] || {}
        const monedaFinal = datosMoneda.moneda || null
        const precioEnDolaresFinal = datosMoneda.precioEnDolares || null
        
        // Log para debugging
        if (monedaFinal === 'USD' || precioEnDolaresFinal) {
          console.log('[API PRODUCTOS] Producto', producto.nombre, '- Proveedor', pp.proveedor.nombre, '- Moneda:', monedaFinal, 'Precio USD:', precioEnDolaresFinal)
        }
        
        return {
          ...pp,
          moneda: monedaFinal,
          precioEnDolares: precioEnDolaresFinal,
          precioEnPesos: datosMoneda.precioEnPesos || null,
          cotizacionUsada: datosMoneda.cotizacionUsada || null,
          fechaCotizacion: datosMoneda.fechaCotizacion || null,
          unidadCompra: datosMoneda.unidadCompra || null,
          cantidadPorUnidadCompra: datosMoneda.cantidadPorUnidadCompra || null,
          tipoIVA: datosMoneda.tipoIVA || null,
          precioIngresadoConIVA: datosMoneda.precioIngresadoConIVA || false,
          precioConIVA: datosMoneda.precioConIVA || null,
          precioSinIVA: datosMoneda.precioSinIVA || null,
        }
      }),
    }))
    
    console.log('[API PRODUCTOS] Primer producto (ejemplo):', productos[0] ? {
      id: productos[0].id,
      nombre: productos[0].nombre,
      activo: productos[0].activo,
      proveedoresCount: productos[0].proveedores?.length || 0,
    } : 'No hay productos')
    
    console.log('[API PRODUCTOS] Devolviendo productos:', productosConMoneda.length)
    return NextResponse.json(productosConMoneda)
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
    
    console.log('[API PRODUCTOS POST] Body recibido completo:', JSON.stringify(body, null, 2))
    console.log('[API PRODUCTOS POST] Proveedores en body:', body.proveedores?.map((p: any) => ({
      proveedorId: p.proveedorId,
      moneda: p.moneda,
      precioCompra: p.precioCompra
    })))

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

    // Verificar si los campos de moneda, presentación e IVA existen ANTES de la transacción
    let camposMonedaExisten = false
    let camposPresentacionExisten = false
    let camposIVAExisten = false
    try {
      // Intentar una consulta simple para verificar si los campos existen
      await prisma.$queryRawUnsafe(`SELECT "moneda" FROM "producto_proveedor" LIMIT 1`)
      camposMonedaExisten = true
      console.log('[API PRODUCTOS POST] Campos de moneda existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTOS POST] Campos de moneda NO existen en BD, usando solo campos básicos')
        camposMonedaExisten = false
      } else {
        console.log('[API PRODUCTOS POST] No se pudo verificar campos de moneda, usando solo campos básicos')
        camposMonedaExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "unidadCompra" FROM "producto_proveedor" LIMIT 1`)
      camposPresentacionExisten = true
      console.log('[API PRODUCTOS POST] Campos de presentación existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTOS POST] Campos de presentación NO existen en BD')
        camposPresentacionExisten = false
      } else {
        camposPresentacionExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "tipoIVA" FROM "producto_proveedor" LIMIT 1`)
      camposIVAExisten = true
      console.log('[API PRODUCTOS POST] Campos de IVA existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTOS POST] Campos de IVA NO existen en BD')
        camposIVAExisten = false
      } else {
        camposIVAExisten = false
      }
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
            select: { id: true }, // Solo seleccionar el id para evitar errores con columnas que no existen
          })
          if (!proveedor) {
            throw new Error(`Proveedor ${prov.proveedorId} no encontrado`)
          }
        }

        // Obtener cotización actual del dólar si hay productos en USD
        let cotizacionActual = null
        const tieneProductosUSD = body.proveedores.some((p: any) => p.moneda === 'USD')
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
        
        // Crear relaciones de proveedores con campos de moneda
        const proveedoresParaCrear = body.proveedores
          .filter((prov: any) => prov.proveedorId)
          .map((prov: any, index: number) => {
            const precioCompra = toNumberOrNull(prov.precioCompra)
            // Asegurar que la moneda se tome del request, no usar default
            const moneda = prov.moneda === 'USD' || prov.moneda === 'UYU' ? prov.moneda : 'UYU'
            let precioEnDolares = null
            let precioEnPesos = null
            
            console.log('[API PRODUCTOS POST] Procesando proveedor:', prov.proveedorId, {
              monedaRecibida: prov.moneda,
              monedaFinal: moneda,
              precioCompra
            })
            
            if (moneda === 'USD' && precioCompra) {
              precioEnDolares = precioCompra
              precioEnPesos = cotizacionActual ? precioCompra * cotizacionActual : null
            } else if (moneda === 'UYU' && precioCompra) {
              precioEnPesos = precioCompra
            }
            
            return {
              productoId: nuevoProducto.id,
              proveedorId: prov.proveedorId,
              precioCompra,
              ordenPreferencia: prov.ordenPreferencia || index + 1,
              moneda,
              precioEnDolares,
              precioEnPesos,
              cotizacionUsada: moneda === 'USD' ? cotizacionActual : null,
              fechaCotizacion: moneda === 'USD' && cotizacionActual ? new Date() : null,
              unidadCompra: toStringOrNull(prov.unidadCompra),
              cantidadPorUnidadCompra: toNumberOrNull(prov.cantidadPorUnidadCompra),
              tipoIVA: toStringOrNull(prov.tipoIVA),
              precioIngresadoConIVA: prov.precioIngresadoConIVA !== undefined ? Boolean(prov.precioIngresadoConIVA) : false,
            }
          })
          
          // Calcular precios con/sin IVA para cada proveedor
          for (const datosProv of proveedoresParaCrear) {
            if (datosProv.precioCompra && datosProv.tipoIVA) {
              const ivaDecimal = parseFloat(datosProv.tipoIVA) / 100
              if (datosProv.precioIngresadoConIVA) {
                // Precio ingresado incluye IVA
                datosProv.precioSinIVA = datosProv.precioCompra / (1 + ivaDecimal)
                datosProv.precioConIVA = datosProv.precioCompra
              } else {
                // Precio ingresado sin IVA
                datosProv.precioSinIVA = datosProv.precioCompra
                datosProv.precioConIVA = datosProv.precioCompra * (1 + ivaDecimal)
              }
            }
          }
        
        // Insertar proveedores según si los campos existen o no (verificado antes de la transacción)
        for (const datosProv of proveedoresParaCrear) {
          // SOLUCIÓN SIMPLE Y DIRECTA: Normalizar moneda
          let monedaParaGuardar = 'UYU'
          if (datosProv.moneda === 'USD' || datosProv.moneda === 'UYU') {
            monedaParaGuardar = datosProv.moneda
          } else if (typeof datosProv.moneda === 'string') {
            const monedaUpper = datosProv.moneda.toUpperCase().trim()
            if (monedaUpper === 'USD' || monedaUpper === 'UYU') {
              monedaParaGuardar = monedaUpper
            }
          }
          
          console.log('[API PRODUCTOS POST] 🔵 MONEDA A GUARDAR:', {
            proveedorId: datosProv.proveedorId,
            monedaRecibida: datosProv.moneda,
            monedaFinal: monedaParaGuardar
          })
          
          console.log('[API PRODUCTOS POST] Guardando proveedor con moneda:', {
            proveedorId: datosProv.proveedorId,
            monedaFinal: monedaFinal,
            monedaParaGuardar: monedaParaGuardar,
            tipo: typeof monedaParaGuardar
          })
          
          // Construir SQL dinámicamente según qué campos existen
          let camposSQL = '"productoId", "proveedorId", "precioCompra", "ordenPreferencia"'
          let valoresSQL = '$1, $2, $3, $4'
          let updateSQL = '"precioCompra" = EXCLUDED."precioCompra", "ordenPreferencia" = EXCLUDED."ordenPreferencia"'
          let params: any[] = [datosProv.productoId, datosProv.proveedorId, datosProv.precioCompra, datosProv.ordenPreferencia]
          let paramIndex = 5
          
          if (camposMonedaExisten) {
            camposSQL += ', "moneda", "precioEnDolares", "precioEnPesos", "cotizacionUsada", "fechaCotizacion"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}`
            // CRÍTICO: Usar EXCLUDED."moneda" para tomar el valor del INSERT
            updateSQL += `, "moneda" = EXCLUDED."moneda", "precioEnDolares" = EXCLUDED."precioEnDolares", "precioEnPesos" = EXCLUDED."precioEnPesos", "cotizacionUsada" = EXCLUDED."cotizacionUsada", "fechaCotizacion" = EXCLUDED."fechaCotizacion"`
            params.push(monedaParaGuardar, datosProv.precioEnDolares, datosProv.precioEnPesos, datosProv.cotizacionUsada, datosProv.fechaCotizacion)
            paramIndex += 5
          }
          
          if (camposPresentacionExisten) {
            camposSQL += ', "unidadCompra", "cantidadPorUnidadCompra"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}`
            params.push(datosProv.unidadCompra, datosProv.cantidadPorUnidadCompra)
            paramIndex += 2
          }
          
          if (camposIVAExisten) {
            camposSQL += ', "tipoIVA", "precioIngresadoConIVA", "precioConIVA", "precioSinIVA"'
            valoresSQL += `, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}`
            params.push(datosProv.tipoIVA, datosProv.precioIngresadoConIVA, datosProv.precioConIVA, datosProv.precioSinIVA)
            paramIndex += 4
          }
          
          // Continuar construyendo UPDATE dinámico (updateSQL ya está declarado arriba)
          if (camposPresentacionExisten) {
            updateSQL += ', "unidadCompra" = EXCLUDED."unidadCompra", "cantidadPorUnidadCompra" = EXCLUDED."cantidadPorUnidadCompra"'
          }
          if (camposIVAExisten) {
            updateSQL += ', "tipoIVA" = EXCLUDED."tipoIVA", "precioIngresadoConIVA" = EXCLUDED."precioIngresadoConIVA", "precioConIVA" = EXCLUDED."precioConIVA", "precioSinIVA" = EXCLUDED."precioSinIVA"'
          }
          
          const sqlQueryFinal = `
            INSERT INTO producto_proveedor (id, ${camposSQL}, "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, ${valoresSQL}, NOW(), NOW())
            ON CONFLICT ("productoId", "proveedorId") DO UPDATE SET
              ${updateSQL},
              "updatedAt" = NOW()
          `
          
          console.log('[API PRODUCTOS POST] SQL a ejecutar:', sqlQueryFinal)
          console.log('[API PRODUCTOS POST] Parámetros:', params.map((p, i) => `$${i + 1} = ${p} (${typeof p})`))
          
          // PRIMERO: Hacer el INSERT/UPDATE normal
          await tx.$executeRawUnsafe(sqlQueryFinal, ...params)
          
          // SEGUNDO: SIEMPRE hacer UPDATE directo de moneda (esto es lo que realmente funciona)
          if (camposMonedaExisten) {
            console.log('[API PRODUCTOS POST] 🔧 EJECUTANDO UPDATE DIRECTO de moneda:', monedaParaGuardar)
            const updateResult = await tx.$executeRawUnsafe(`
              UPDATE "producto_proveedor" 
              SET "moneda" = $1::text
              WHERE "productoId" = $2 AND "proveedorId" = $3
            `, monedaParaGuardar, datosProv.productoId, datosProv.proveedorId)
            console.log('[API PRODUCTOS POST] ✅ UPDATE ejecutado, filas afectadas:', updateResult)
          }
          
          // VERIFICACIÓN CRÍTICA: Leer directamente de la BD qué se guardó
          const verificarMoneda = await tx.$queryRawUnsafe<Array<{ moneda: string | null }>>(`
            SELECT "moneda" FROM "producto_proveedor" 
            WHERE "productoId" = $1 AND "proveedorId" = $2
          `, datosProv.productoId, datosProv.proveedorId)
          
          console.log('[API PRODUCTOS POST] ⚠️ VERIFICACIÓN POST-GUARDADO:', {
            productoId: datosProv.productoId,
            proveedorId: datosProv.proveedorId,
            monedaEnviada: monedaParaGuardar,
            monedaGuardadaEnBD: verificarMoneda[0]?.moneda,
            tipoMonedaEnBD: typeof verificarMoneda[0]?.moneda,
            COINCIDE: verificarMoneda[0]?.moneda === monedaParaGuardar ? '✅ SÍ' : '❌ NO'
          })
          
          // Si no coincide después del UPDATE directo, hay un problema serio
          if (verificarMoneda[0]?.moneda !== monedaParaGuardar) {
            console.error('[API PRODUCTOS POST] ❌ ERROR CRÍTICO: Moneda NO se guardó correctamente después de UPDATE directo!', {
              monedaEnviada: monedaParaGuardar,
              monedaGuardada: verificarMoneda[0]?.moneda,
              productoId: datosProv.productoId,
              proveedorId: datosProv.proveedorId
            })
          }
        }
      }

      // Retornar producto con proveedores e inventario usando select explícito
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

// API Route para operaciones individuales de Productos - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API PRODUCTO] Obteniendo producto:', params.id)
    
    // Usar select explícito para evitar leer campos que no existen en la BD
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
      console.log('[API PRODUCTO] Producto no encontrado:', params.id)
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    console.log('[API PRODUCTO] Producto encontrado:', producto.id, producto.nombre)

    // Leer campos adicionales (moneda y presentación) usando SQL directo
    const proveedorIds = producto.proveedores.map(pp => pp.id).filter((id): id is string => id !== undefined)
    let camposAdicionales: Record<string, any> = {}
    
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
        
        result.forEach((row) => {
          // Si no hay moneda pero hay precioEnDolares, asumir que es USD
          const moneda = row.moneda || (row.precioEnDolares ? 'USD' : null)
          
          console.log('[API PRODUCTO GET] Leyendo proveedor desde BD:', row.id, {
            monedaEnBD: row.moneda,
            tipoMonedaEnBD: typeof row.moneda,
            precioEnDolares: row.precioEnDolares,
            precioEnPesos: row.precioEnPesos,
            monedaFinal: moneda
          })
          
          camposAdicionales[row.id] = {
            moneda: moneda,
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
          
          // Log para todos los proveedores, no solo USD
          console.log('[API PRODUCTO GET] Campos adicionales asignados:', row.id, camposAdicionales[row.id])
        })
      } catch (error: any) {
        console.log('[API PRODUCTO GET] Error al leer campos adicionales:', error?.message)
      }
    }
    
    // Asegurar que los campos nuevos tengan valores por defecto si son null (para productos antiguos)
    const productoConDefaults = {
      ...producto,
      proveedores: producto.proveedores.map((pp: any) => {
        const campos = camposAdicionales[pp.id] || {}
        // Si no hay moneda guardada pero hay precioEnDolares, usar USD
        const moneda = campos.moneda || (campos.precioEnDolares ? 'USD' : 'UYU')
        const precioEnDolares = campos.precioEnDolares ?? null
        const precioEnPesos = campos.precioEnPesos ?? (moneda === 'UYU' ? pp.precioCompra : null)
        const cotizacionUsada = campos.cotizacionUsada ?? null
        const fechaCotizacion = campos.fechaCotizacion ?? null
        
        console.log('[API PRODUCTO GET] Procesando proveedor:', pp.id, {
          monedaGuardada: campos.moneda,
          precioEnDolares: campos.precioEnDolares,
          monedaFinal: moneda
        })
        
        return {
          ...pp,
          moneda,
          precioEnDolares,
          precioEnPesos,
          cotizacionUsada,
          fechaCotizacion,
          unidadCompra: campos.unidadCompra || null,
          cantidadPorUnidadCompra: campos.cantidadPorUnidadCompra || null,
          tipoIVA: campos.tipoIVA || null,
          precioIngresadoConIVA: campos.precioIngresadoConIVA || false,
          precioConIVA: campos.precioConIVA || null,
          precioSinIVA: campos.precioSinIVA || null,
        }
      }),
    }

    console.log('[API PRODUCTO] Producto procesado, devolviendo respuesta')
    return NextResponse.json(productoConDefaults)
  } catch (error: any) {
    console.error('[API PRODUCTO] Error completo:', error)
    console.error('[API PRODUCTO] Error message:', error?.message)
    console.error('[API PRODUCTO] Error stack:', error?.stack)
    console.error('[API PRODUCTO] Error name:', error?.name)
    return NextResponse.json(
      { 
        error: 'Error al obtener producto',
        details: error?.message || String(error),
      },
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
    
    console.log('[API PRODUCTO PUT] Body recibido completo:', JSON.stringify(body, null, 2))
    console.log('[API PRODUCTO PUT] Proveedores en body:', body.proveedores?.map((p: any) => ({
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

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id: params.id },
    })
    if (!productoExistente) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
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

    console.log('[API PRODUCTO PUT] Iniciando actualización de producto:', params.id)
    console.log('[API PRODUCTO PUT] Body recibido:', JSON.stringify(body, null, 2))
    
    // Verificar si los campos de moneda, presentación e IVA existen ANTES de la transacción
    let camposMonedaExisten = false
    let camposPresentacionExisten = false
    let camposIVAExisten = false
    try {
      // Intentar una consulta simple para verificar si los campos existen
      await prisma.$queryRawUnsafe(`SELECT "moneda" FROM "producto_proveedor" LIMIT 1`)
      camposMonedaExisten = true
      console.log('[API PRODUCTO PUT] Campos de moneda existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTO PUT] Campos de moneda NO existen en BD, usando solo campos básicos')
        camposMonedaExisten = false
      } else {
        console.log('[API PRODUCTO PUT] No se pudo verificar campos de moneda, usando solo campos básicos')
        camposMonedaExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "unidadCompra" FROM "producto_proveedor" LIMIT 1`)
      camposPresentacionExisten = true
      console.log('[API PRODUCTO PUT] Campos de presentación existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTO PUT] Campos de presentación NO existen en BD')
        camposPresentacionExisten = false
      } else {
        camposPresentacionExisten = false
      }
    }
    
    try {
      await prisma.$queryRawUnsafe(`SELECT "tipoIVA" FROM "producto_proveedor" LIMIT 1`)
      camposIVAExisten = true
      console.log('[API PRODUCTO PUT] Campos de IVA existen en BD')
    } catch (error: any) {
      if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
        console.log('[API PRODUCTO PUT] Campos de IVA NO existen en BD')
        camposIVAExisten = false
      } else {
        camposIVAExisten = false
      }
    }
    
    // Actualizar producto usando transacción
    const producto = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos del producto
      const productoActualizado = await tx.producto.update({
        where: { id: params.id },
        data: {
          nombre: body.nombre.trim(),
          codigo: toStringOrNull(body.codigo),
          descripcion: toStringOrNull(body.descripcion),
          unidad: body.unidad || productoExistente.unidad,
          stockMinimo: toNumberOrNull(body.stockMinimo) ?? productoExistente.stockMinimo,
          rubro: toStringOrNull(body.rubro),
          activo: body.activo !== undefined ? Boolean(body.activo) : productoExistente.activo,
        },
      })

      // Si se proporcionan proveedores, actualizar relaciones
      if (body.proveedores !== undefined && Array.isArray(body.proveedores)) {
        console.log('[API PRODUCTO PUT] Actualizando proveedores, cantidad:', body.proveedores.length)
        
        // Eliminar relaciones existentes
        await tx.productoProveedor.deleteMany({
          where: { productoId: params.id },
        })
        console.log('[API PRODUCTO PUT] Relaciones anteriores eliminadas')

        // Crear nuevas relaciones
        if (body.proveedores.length > 0) {
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
          console.log('[API PRODUCTO PUT] Todos los proveedores validados')

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
              console.warn('[API PRODUCTO PUT] No se pudo obtener cotización:', err)
            }
          }
          
          // Crear datos con campos de moneda y presentación
          const datosProveedores = body.proveedores
            .filter((prov: any) => prov.proveedorId)
            .map((prov: any, index: number) => {
              const precioCompra = toNumberOrNull(prov.precioCompra)
              // Asegurar que la moneda se tome del request, no usar default
              const moneda = prov.moneda === 'USD' || prov.moneda === 'UYU' ? prov.moneda : 'UYU'
              let precioEnDolares = null
              let precioEnPesos = null
              
              console.log('[API PRODUCTO PUT] Procesando proveedor:', prov.proveedorId, {
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
                productoId: params.id,
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
          for (const datosProv of datosProveedores) {
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
          
          console.log('[API PRODUCTO PUT] Creando', datosProveedores.length, 'relaciones de proveedores')
          
          // Insertar proveedores según si los campos existen o no (verificado antes de la transacción)
          for (const datosProv of datosProveedores) {
            // Asegurar que la moneda tenga un valor válido ANTES de cualquier inserción
            // Validar explícitamente que sea string y que sea 'USD' o 'UYU'
            let monedaFinal: string = 'UYU' // Default seguro
            if (typeof datosProv.moneda === 'string') {
              const monedaUpper = datosProv.moneda.toUpperCase().trim()
              if (monedaUpper === 'USD' || monedaUpper === 'UYU') {
                monedaFinal = monedaUpper
              }
            }
            
            // ACTUALIZAR datosProv.moneda con el valor final validado
            datosProv.moneda = monedaFinal
            
            console.log('[API PRODUCTO PUT] Guardando proveedor:', {
              proveedorId: datosProv.proveedorId,
              monedaRecibida: datosProv.moneda,
              tipoMonedaRecibida: typeof datosProv.moneda,
              monedaFinal: monedaFinal,
              tipoMonedaFinal: typeof monedaFinal,
              precioCompra: datosProv.precioCompra,
              precioEnDolares: datosProv.precioEnDolares,
              precioEnPesos: datosProv.precioEnPesos
            })
            
            if (camposMonedaExisten && camposPresentacionExisten && camposIVAExisten) {
              // SOLUCIÓN EFICAZ: Usar Prisma.upsert() directamente - más confiable que SQL crudo
              const monedaParaGuardar: string = monedaFinal || 'UYU'
              
              console.log('[API PRODUCTO PUT] Usando Prisma.upsert con moneda:', {
                proveedorId: datosProv.proveedorId,
                monedaFinal: monedaFinal,
                monedaParaGuardar: monedaParaGuardar,
                tipo: typeof monedaParaGuardar
              })
              
              await tx.productoProveedor.upsert({
                where: {
                  productoId_proveedorId: {
                    productoId: datosProv.productoId,
                    proveedorId: datosProv.proveedorId,
                  },
                },
                create: {
                  productoId: datosProv.productoId,
                  proveedorId: datosProv.proveedorId,
                  precioCompra: datosProv.precioCompra,
                  ordenPreferencia: datosProv.ordenPreferencia,
                  moneda: monedaParaGuardar, // Prisma manejará esto correctamente
                  precioEnDolares: datosProv.precioEnDolares,
                  precioEnPesos: datosProv.precioEnPesos,
                  cotizacionUsada: datosProv.cotizacionUsada,
                  fechaCotizacion: datosProv.fechaCotizacion,
                  unidadCompra: datosProv.unidadCompra,
                  cantidadPorUnidadCompra: datosProv.cantidadPorUnidadCompra,
                  tipoIVA: datosProv.tipoIVA,
                  precioIngresadoConIVA: datosProv.precioIngresadoConIVA,
                  precioConIVA: datosProv.precioConIVA,
                  precioSinIVA: datosProv.precioSinIVA,
                },
                update: {
                  precioCompra: datosProv.precioCompra,
                  ordenPreferencia: datosProv.ordenPreferencia,
                  moneda: monedaParaGuardar, // Asegurar que se actualice siempre
                  precioEnDolares: datosProv.precioEnDolares,
                  precioEnPesos: datosProv.precioEnPesos,
                  cotizacionUsada: datosProv.cotizacionUsada,
                  fechaCotizacion: datosProv.fechaCotizacion,
                  unidadCompra: datosProv.unidadCompra,
                  cantidadPorUnidadCompra: datosProv.cantidadPorUnidadCompra,
                  tipoIVA: datosProv.tipoIVA,
                  precioIngresadoConIVA: datosProv.precioIngresadoConIVA,
                  precioConIVA: datosProv.precioConIVA,
                  precioSinIVA: datosProv.precioSinIVA,
                },
              })
              
              // Verificar qué se guardó realmente usando Prisma
              const verificarGuardado = await tx.productoProveedor.findUnique({
                where: {
                  productoId_proveedorId: {
                    productoId: datosProv.productoId,
                    proveedorId: datosProv.proveedorId,
                  },
                },
                select: { moneda: true },
              })
              
              console.log('[API PRODUCTO PUT] Verificación post-UPSERT:', {
                productoId: datosProv.productoId,
                proveedorId: datosProv.proveedorId,
                monedaEnviada: monedaFinal,
                monedaGuardadaEnBD: verificarGuardado?.moneda,
                tipoMonedaEnBD: typeof verificarGuardado?.moneda
              })
            } else {
              // SOLUCIÓN EFICAZ: Usar Prisma.upsert() para todos los casos - más confiable
              // Si las columnas no existen, Prisma las omitirá automáticamente
              const monedaParaGuardar: string = monedaFinal || 'UYU'
              
              const dataToUpsert: any = {
                precioCompra: datosProv.precioCompra,
                ordenPreferencia: datosProv.ordenPreferencia,
                moneda: monedaParaGuardar, // SIEMPRE incluir moneda
              }
              
              // Agregar campos opcionales solo si existen
              if (camposMonedaExisten) {
                dataToUpsert.precioEnDolares = datosProv.precioEnDolares
                dataToUpsert.precioEnPesos = datosProv.precioEnPesos
                dataToUpsert.cotizacionUsada = datosProv.cotizacionUsada
                dataToUpsert.fechaCotizacion = datosProv.fechaCotizacion
              }
              
              if (camposPresentacionExisten) {
                dataToUpsert.unidadCompra = datosProv.unidadCompra
                dataToUpsert.cantidadPorUnidadCompra = datosProv.cantidadPorUnidadCompra
              }
              
              if (camposIVAExisten) {
                dataToUpsert.tipoIVA = datosProv.tipoIVA
                dataToUpsert.precioIngresadoConIVA = datosProv.precioIngresadoConIVA
                dataToUpsert.precioConIVA = datosProv.precioConIVA
                dataToUpsert.precioSinIVA = datosProv.precioSinIVA
              }
              
              await tx.productoProveedor.upsert({
                where: {
                  productoId_proveedorId: {
                    productoId: datosProv.productoId,
                    proveedorId: datosProv.proveedorId,
                  },
                },
                create: {
                  productoId: datosProv.productoId,
                  proveedorId: datosProv.proveedorId,
                  ...dataToUpsert,
                },
                update: dataToUpsert,
              })
              
              console.log('[API PRODUCTO PUT] Upsert completado con moneda:', monedaParaGuardar)
            }
          }
          
          console.log('[API PRODUCTO PUT] Relaciones de proveedores creadas exitosamente')
        }
      }

      // Retornar producto con proveedores actualizados usando select explícito
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

    console.log('[API PRODUCTO PUT] Producto actualizado exitosamente')
    return NextResponse.json(producto)
  } catch (error: any) {
    console.error('[API PRODUCTO PUT] Error completo:', error)
    console.error('[API PRODUCTO PUT] Error message:', error?.message || String(error))
    console.error('[API PRODUCTO PUT] Error stack:', error?.stack)
    console.error('[API PRODUCTO PUT] Error code:', error?.code)
    console.error('[API PRODUCTO PUT] Error name:', error?.name)
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar producto', 
        details: error?.message || String(error),
        code: error?.code,
      },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un producto
// Si el usuario es ADMIN (dueño): hard delete (eliminación completa)
// Si no es ADMIN: soft delete (marcar como inactivo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener usuario actual desde la sesión
    const user = await getCurrentUser()
    const userIsAdmin = isAdmin(user)

    if (userIsAdmin) {
      // Hard delete: Eliminar completamente el producto y sus relaciones
      await prisma.$transaction(async (tx) => {
        // Eliminar relaciones primero (por las foreign keys)
        await tx.productoProveedor.deleteMany({
          where: { productoId: params.id },
        })
        await tx.recetaIngrediente.deleteMany({
          where: { productoId: params.id },
        })
        await tx.itemPedido.deleteMany({
          where: { productoId: params.id },
        })
        await tx.inventario.deleteMany({
          where: { productoId: params.id },
        })

        // Finalmente eliminar el producto
        await tx.producto.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({ message: 'Producto eliminado permanentemente' })
    } else {
      // Soft delete: Marcar como inactivo
      const producto = await prisma.producto.update({
        where: { id: params.id },
        data: {
          activo: false,
        },
      })

      return NextResponse.json(producto)
    }
  } catch (error: any) {
    console.error('Error en DELETE /api/productos/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

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

    // Asegurar que los campos nuevos tengan valores por defecto si son null (para productos antiguos)
    // Usar hasOwnProperty para verificar si los campos existen antes de acceder
    const productoConDefaults = {
      ...producto,
      proveedores: producto.proveedores.map((pp: any) => {
        // Verificar si los campos nuevos existen, si no, usar valores por defecto
        const moneda = pp.hasOwnProperty('moneda') ? (pp.moneda || 'UYU') : 'UYU'
        const precioEnDolares = pp.hasOwnProperty('precioEnDolares') ? (pp.precioEnDolares ?? null) : null
        const precioEnPesos = pp.hasOwnProperty('precioEnPesos') 
          ? (pp.precioEnPesos ?? (moneda === 'UYU' ? pp.precioCompra : null))
          : (moneda === 'UYU' ? pp.precioCompra : null)
        const cotizacionUsada = pp.hasOwnProperty('cotizacionUsada') ? (pp.cotizacionUsada ?? null) : null
        const fechaCotizacion = pp.hasOwnProperty('fechaCotizacion') ? (pp.fechaCotizacion ?? null) : null
        
        return {
          ...pp,
          moneda,
          precioEnDolares,
          precioEnPesos,
          cotizacionUsada,
          fechaCotizacion,
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
          
          // Crear datos con campos de moneda
          const datosProveedores = body.proveedores
            .filter((prov: any) => prov.proveedorId)
            .map((prov: any, index: number) => {
              const precioCompra = toNumberOrNull(prov.precioCompra)
              const moneda = prov.moneda || 'UYU'
              let precioEnDolares = null
              let precioEnPesos = null
              
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
              }
            })
          
          console.log('[API PRODUCTO PUT] Creando', datosProveedores.length, 'relaciones de proveedores')
          
          // Intentar insertar con campos de moneda, si falla usar solo campos básicos
          for (const datosProv of datosProveedores) {
            try {
              // Intentar insertar con campos de moneda
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
                datosProv.productoId,
                datosProv.proveedorId,
                datosProv.precioCompra,
                datosProv.ordenPreferencia,
                datosProv.moneda,
                datosProv.precioEnDolares,
                datosProv.precioEnPesos,
                datosProv.cotizacionUsada,
                datosProv.fechaCotizacion
              )
            } catch (error: any) {
              // Si los campos de moneda no existen, insertar solo campos básicos
              if (error?.meta?.code === '42703' || error?.message?.includes('does not exist')) {
                console.log('[API PRODUCTO PUT] Campos de moneda no existen, usando solo campos básicos')
                await tx.$executeRawUnsafe(`
                  INSERT INTO producto_proveedor (id, "productoId", "proveedorId", "precioCompra", "ordenPreferencia", "createdAt", "updatedAt")
                  VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
                  ON CONFLICT ("productoId", "proveedorId") DO UPDATE SET
                    "precioCompra" = EXCLUDED."precioCompra",
                    "ordenPreferencia" = EXCLUDED."ordenPreferencia",
                    "updatedAt" = NOW()
                `,
                  datosProv.productoId,
                  datosProv.proveedorId,
                  datosProv.precioCompra,
                  datosProv.ordenPreferencia
                )
              } else {
                throw error
              }
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

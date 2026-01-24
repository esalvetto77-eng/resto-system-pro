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

    // Asegurar que los campos nuevos tengan valores por defecto si son null (para productos antiguos)
    const productoConDefaults = {
      ...producto,
      proveedores: producto.proveedores.map((pp: any) => ({
        ...pp,
        moneda: pp.moneda || 'UYU',
        precioEnDolares: pp.precioEnDolares ?? null,
        precioEnPesos: pp.precioEnPesos ?? (pp.moneda === 'UYU' || !pp.moneda ? pp.precioCompra : null),
        cotizacionUsada: pp.cotizacionUsada ?? null,
        fechaCotizacion: pp.fechaCotizacion ?? null,
      })),
    }

    return NextResponse.json(productoConDefaults)
  } catch (error: any) {
    console.error('Error en GET /api/productos/[id]:', error?.message || String(error))
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
        // Eliminar relaciones existentes
        await tx.productoProveedor.deleteMany({
          where: { productoId: params.id },
        })

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
                  productoId: params.id,
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
      }

      // Retornar producto con proveedores actualizados
      return await tx.producto.findUnique({
        where: { id: params.id },
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

    return NextResponse.json(producto)
  } catch (error: any) {
    console.error('Error en PUT /api/productos/[id]:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al actualizar producto', details: error?.message },
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

// API Route para actualizar cotización y recalcular precios de productos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { obtenerCotizacionBROU } from '@/lib/utils'

// CRÍTICO: Usar Node.js runtime (no Edge) para Prisma
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación opcional (para servicios externos de cron)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.COTIZACION_UPDATE_SECRET
    
    // Si hay un secret configurado, verificar autenticación
    // Si no hay secret, permitir acceso (para uso interno)
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      // Intentar verificar si es un usuario autenticado
      try {
        const { getCurrentUser, isAdmin } = await import('@/lib/auth')
        const user = await getCurrentUser()
        if (!user || !isAdmin(user)) {
          return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
          )
        }
      } catch {
        // Si no puede verificar usuario, requerir secret
        return NextResponse.json(
          { error: 'No autorizado. Se requiere secret o autenticación de admin.' },
          { status: 401 }
        )
      }
    }
    
    console.log('[ACTUALIZAR COTIZACION] Iniciando actualización de cotización y precios...')
    
    // Obtener cotización actual del BROU
    const cotizacion = await obtenerCotizacionBROU()
    
    if (!cotizacion) {
      return NextResponse.json(
        { error: 'No se pudo obtener la cotización del BROU' },
        { status: 500 }
      )
    }
    
    const cotizacionPromedio = (cotizacion.compra + cotizacion.venta) / 2
    console.log('[ACTUALIZAR COTIZACION] Cotización obtenida:', cotizacionPromedio)
    
    // Verificar si los campos de moneda existen en la BD
    // Por ahora, solo actualizamos si los campos existen
    try {
      // Obtener todos los productos con proveedores que tienen precio en dólares
      // Nota: Esto solo funcionará cuando los campos existan en la BD
      const productosConDolares = await prisma.productoProveedor.findMany({
        where: {
          moneda: 'USD',
          precioEnDolares: { not: null },
        },
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      })
      
      console.log('[ACTUALIZAR COTIZACION] Productos en dólares encontrados:', productosConDolares.length)
      
      // Actualizar precios en pesos para productos en dólares
      let actualizados = 0
      for (const productoProveedor of productosConDolares) {
        if (productoProveedor.precioEnDolares) {
          const nuevoPrecioEnPesos = productoProveedor.precioEnDolares * cotizacionPromedio
          
          try {
            await prisma.productoProveedor.update({
              where: { id: productoProveedor.id },
              data: {
                precioEnPesos: nuevoPrecioEnPesos,
                cotizacionUsada: cotizacionPromedio,
                fechaCotizacion: new Date(),
              },
            })
            actualizados++
          } catch (updateError: any) {
            // Si los campos no existen, usar SQL directo
            if (updateError.code === 'P2022' || updateError.message?.includes('does not exist')) {
              console.warn('[ACTUALIZAR COTIZACION] Campos no existen aún, usando SQL directo')
              // Los campos aún no existen, no podemos actualizar
              // Esto se hará cuando se agreguen los campos a la BD
            } else {
              console.error('[ACTUALIZAR COTIZACION] Error al actualizar producto:', updateError)
            }
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        cotizacion,
        productosActualizados: actualizados,
        mensaje: `Cotización actualizada: ${cotizacionPromedio.toFixed(2)} UYU. ${actualizados} productos actualizados.`,
      })
    } catch (error: any) {
      // Si los campos no existen, solo retornamos la cotización
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        console.warn('[ACTUALIZAR COTIZACION] Campos de moneda no existen aún en la BD')
        return NextResponse.json({
          success: true,
          cotizacion,
          productosActualizados: 0,
          mensaje: `Cotización obtenida: ${cotizacionPromedio.toFixed(2)} UYU. Los campos de moneda aún no existen en la BD.`,
          advertencia: 'Los campos de moneda deben agregarse a la BD para actualizar precios automáticamente.',
        })
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('[ACTUALIZAR COTIZACION] Error:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar cotización y precios',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

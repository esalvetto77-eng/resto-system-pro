// API Route para actualizar cotización y recalcular precios de productos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { obtenerCotizacionBROU } from '@/lib/utils'

// CRÍTICO: Usar Node.js runtime (no Edge) para Prisma
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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
    
    // Actualizar precios de productos en dólares usando SQL directo
    let actualizados = 0
    try {
      // Verificar si los campos existen antes de intentar actualizar
      const checkResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM producto_proveedor
        WHERE moneda = 'USD' AND "precioEnDolares" IS NOT NULL
        LIMIT 1
      `) as Array<{ count: bigint }>
      
      if (checkResult[0]?.count && Number(checkResult[0].count) > 0) {
        // Los campos existen, actualizar usando SQL directo
        const result = await prisma.$executeRawUnsafe(`
          UPDATE producto_proveedor
          SET 
            "precioEnPesos" = "precioEnDolares" * $1,
            "cotizacionUsada" = $1,
            "fechaCotizacion" = NOW(),
            "updatedAt" = NOW()
          WHERE moneda = 'USD' AND "precioEnDolares" IS NOT NULL
        `, cotizacionPromedio)
        
        actualizados = Number(result) || 0
        console.log('[ACTUALIZAR COTIZACION] Productos actualizados:', actualizados)
      } else {
        console.log('[ACTUALIZAR COTIZACION] No hay productos en dólares para actualizar')
      }
    } catch (error: any) {
      // Si los campos no existen, solo loguear
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        console.warn('[ACTUALIZAR COTIZACION] Campos de moneda no existen aún en la BD')
      } else {
        console.error('[ACTUALIZAR COTIZACION] Error al actualizar productos:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      cotizacion,
      productosActualizados: actualizados,
      mensaje: `Cotización actualizada: ${cotizacionPromedio.toFixed(2)} UYU (Compra: ${cotizacion.compra.toFixed(2)}, Venta: ${cotizacion.venta.toFixed(2)}). ${actualizados} productos actualizados.`,
    })
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

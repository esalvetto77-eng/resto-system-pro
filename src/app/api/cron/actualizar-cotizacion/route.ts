// Cron Job para actualizar cotización del dólar automáticamente
// Este endpoint se ejecuta periódicamente via Vercel Cron
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { obtenerCotizacionBROU } from '@/lib/utils'

// CRÍTICO: Usar Node.js runtime (no Edge) para Prisma
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Verificar que la solicitud viene de Vercel Cron
function verificarCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del cron
    if (!verificarCronAuth(request)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    console.log('[CRON COTIZACION] Ejecutando actualización automática de cotización...')
    
    // Obtener cotización actual del BROU
    const cotizacion = await obtenerCotizacionBROU()
    
    if (!cotizacion) {
      return NextResponse.json(
        { error: 'No se pudo obtener la cotización del BROU' },
        { status: 500 }
      )
    }
    
    const cotizacionPromedio = (cotizacion.compra + cotizacion.venta) / 2
    console.log('[CRON COTIZACION] Cotización obtenida:', cotizacionPromedio)
    
    // Intentar actualizar precios de productos en dólares
    let actualizados = 0
    try {
      // Verificar si los campos existen antes de intentar actualizar
      const productosConDolares = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM producto_proveedor
        WHERE moneda = 'USD' AND "precioEnDolares" IS NOT NULL
        LIMIT 1
      `) as Array<{ count: bigint }>
      
      if (productosConDolares[0]?.count && Number(productosConDolares[0].count) > 0) {
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
        console.log('[CRON COTIZACION] Productos actualizados:', actualizados)
      } else {
        console.log('[CRON COTIZACION] Campos de moneda aún no existen en la BD')
      }
    } catch (error: any) {
      // Si los campos no existen, solo loguear
      if (error.code === 'P2022' || error.message?.includes('does not exist')) {
        console.warn('[CRON COTIZACION] Campos de moneda no existen aún en la BD')
      } else {
        console.error('[CRON COTIZACION] Error al actualizar productos:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      cotizacion,
      productosActualizados: actualizados,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[CRON COTIZACION] Error:', error)
    return NextResponse.json(
      { 
        error: 'Error en cron job de cotización',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

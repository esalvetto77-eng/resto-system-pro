// API Route para obtener cotización del dólar del BROU
import { NextRequest, NextResponse } from 'next/server'
import { obtenerCotizacionBROU } from '@/lib/utils'

// CRÍTICO: Usar Node.js runtime (no Edge) para fetch
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cotizacion = await obtenerCotizacionBROU()
    
    if (!cotizacion) {
      return NextResponse.json(
        { error: 'No se pudo obtener la cotización' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(cotizacion)
  } catch (error: any) {
    console.error('[COTIZACION] Error en API:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización del dólar' },
      { status: 500 }
    )
  }
}

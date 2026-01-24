// API Route para agregar campos de moneda a la base de datos de producción
// Ejecutar: POST /api/admin/add-currency-fields
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const user = await getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('[API ADMIN] Agregando campos de moneda a producto_proveedor...')
    
    // Agregar columnas si no existen
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "producto_proveedor" 
      ADD COLUMN IF NOT EXISTS "moneda" TEXT DEFAULT 'UYU',
      ADD COLUMN IF NOT EXISTS "precioEnDolares" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "precioEnPesos" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "cotizacionUsada" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "fechaCotizacion" TIMESTAMP;
    `)
    
    console.log('[API ADMIN] Campos de moneda agregados exitosamente')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campos de moneda agregados exitosamente' 
    })
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Los campos ya existen en la base de datos' 
      })
    }
    
    console.error('[API ADMIN] Error al agregar campos:', error)
    return NextResponse.json(
      { error: 'Error al agregar campos de moneda', details: error.message },
      { status: 500 }
    )
  }
}

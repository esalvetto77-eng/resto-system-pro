// API Route para agregar los campos de datos de pago a la tabla proveedores
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y autorización
    const user = await getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de administrador.' },
        { status: 401 }
      )
    }

    console.log('[ADD DATOS PAGO FIELDS] Iniciando agregado de campos de datos de pago...')

    // Verificar si los campos ya existen
    let yaExistian = false
    try {
      const resultado = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'proveedores' 
         AND column_name IN ('numero_cuenta', 'banco')`
      )

      const camposExistentes = resultado.map(r => r.column_name)
      const tieneNumeroCuenta = camposExistentes.includes('numero_cuenta')
      const tieneBanco = camposExistentes.includes('banco')

      if (tieneNumeroCuenta && tieneBanco) {
        return NextResponse.json({
          success: true,
          message: 'Los campos de datos de pago ya existen en la tabla proveedores.',
          yaExistian: true,
        })
      }
    } catch (checkError: any) {
      console.log('[ADD DATOS PAGO FIELDS] Error al verificar campos (continuando):', checkError?.message)
    }

    // Agregar los campos
    await prisma.$executeRawUnsafe(
      `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS numero_cuenta TEXT`
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS banco TEXT`
    )

    console.log('[ADD DATOS PAGO FIELDS] Campos de datos de pago agregados exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Campos de datos de pago (número de cuenta y banco) agregados exitosamente a la tabla proveedores.',
    })
  } catch (error: any) {
    console.error('[ADD DATOS PAGO FIELDS] Error:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    return NextResponse.json(
      {
        error: 'Error al agregar campos de datos de pago',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

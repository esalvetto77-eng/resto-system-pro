// API Route para agregar el campo canalVenta a la tabla ventas
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

    console.log('[ADD CANAL VENTA FIELD] Iniciando agregado de campo canalVenta...')

    // Verificar si el campo ya existe
    let yaExistia = false
    try {
      const resultado = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'ventas' 
         AND column_name = 'canalVenta'`
      )

      if (resultado && resultado.length > 0) {
        yaExistia = true
      }
    } catch (checkError: any) {
      console.log('[ADD CANAL VENTA FIELD] Error al verificar campo (continuando):', checkError?.message)
    }

    if (yaExistia) {
      return NextResponse.json({
        success: true,
        message: 'El campo canalVenta ya existe en la tabla ventas.',
        yaExistia: true,
      })
    }

    // Agregar el campo
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS "canalVenta" TEXT`
    )

    console.log('[ADD CANAL VENTA FIELD] Campo canalVenta agregado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Campo canalVenta agregado exitosamente a la tabla ventas.',
    })
  } catch (error: any) {
    console.error('[ADD CANAL VENTA FIELD] Error:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    return NextResponse.json(
      {
        error: 'Error al agregar campo canalVenta',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

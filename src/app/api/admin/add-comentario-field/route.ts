// API Route para agregar el campo comentario a la tabla proveedores
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

    console.log('[ADD COMENTARIO FIELD] Iniciando agregado de campo comentario...')

    // Verificar si el campo ya existe
    try {
      const resultado = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'proveedores' 
         AND column_name = 'comentario'`
      )

      if (resultado && resultado.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'El campo comentario ya existe en la tabla proveedores.',
          yaExistia: true,
        })
      }
    } catch (checkError: any) {
      console.log('[ADD COMENTARIO FIELD] Error al verificar campo (continuando):', checkError?.message)
    }

    // Agregar el campo comentario
    await prisma.$executeRawUnsafe(
      `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS comentario TEXT`
    )

    console.log('[ADD COMENTARIO FIELD] Campo comentario agregado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Campo comentario agregado exitosamente a la tabla proveedores.',
    })
  } catch (error: any) {
    console.error('[ADD COMENTARIO FIELD] Error:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    return NextResponse.json(
      {
        error: 'Error al agregar campo comentario',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

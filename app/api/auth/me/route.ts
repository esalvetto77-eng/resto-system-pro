// API Route para obtener usuario actual
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
// Prisma no funciona en Edge runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // No cachear - siempre consultar DB

export async function GET(request: NextRequest) {
  try {
    console.log('[API] /api/auth/me: Iniciando verificación de usuario')
    
    const user = await getCurrentUser()

    if (!user) {
      console.log('[API] /api/auth/me: Usuario no autenticado - Retornando 401')
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // LOG: Datos que se envían al frontend
    console.log('[API] /api/auth/me: Usuario autenticado - Enviando al frontend:', {
      id: user.id,
      email: user.email,
      rol: user.rol,
      fuente: 'Backend -> Frontend (vía getCurrentUser que consulta DB)',
    })

    // Headers para evitar caché en producción
    const response = NextResponse.json(user)
    
    // No cachear respuestas de autenticación
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('[API] /api/auth/me: Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// API Route para logout
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionCookieNames } from '@/lib/session'

// CRÍTICO: Usar Node.js runtime para cookies (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { primary, legacy } = getSessionCookieNames()
    // Borrar ambos por compatibilidad
    cookieStore.delete(primary)
    cookieStore.delete(legacy)

    return NextResponse.json({ message: 'Sesión cerrada' })
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

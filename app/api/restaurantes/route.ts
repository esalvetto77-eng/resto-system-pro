// API Route para Restaurantes - Versión ultra simplificada
import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los restaurantes (solo ADMIN puede ver/editar)
export async function GET() {
  const user = await getCurrentUser()
  
  // Solo ADMIN puede ver restaurantes
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'No autorizado. Solo administradores pueden ver restaurantes.' },
      { status: 403 }
    )
  }
  try {
    const restaurantes = await prisma.restaurante.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(restaurantes)
  } catch (error: any) {
    console.error('Error en GET /api/restaurantes:', error?.message || String(error))
    return NextResponse.json([])
  }
}

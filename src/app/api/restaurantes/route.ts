// API Route para Restaurantes - Versión ultra simplificada
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar restaurantes
// - Todos los usuarios autenticados pueden ver restaurantes activos
// - Solo ADMIN puede ver todos los restaurantes (activos e inactivos)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  
  // Verificar autenticación
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const soloActivos = searchParams.get('activo') === 'true'
    
    // Si se solicita solo activos, cualquier usuario autenticado puede verlos
    // Si no se especifica, solo ADMIN puede ver todos (activos e inactivos)
    const where: any = {}
    
    if (soloActivos) {
      where.activo = true
    } else if (!isAdmin(user)) {
      // Si no es admin y no especificó activo=true, solo mostrar activos por defecto
      where.activo = true
    }
    
    const restaurantes = await prisma.restaurante.findMany({
      where,
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(restaurantes)
  } catch (error: any) {
    console.error('Error en GET /api/restaurantes:', error?.message || String(error))
    return NextResponse.json([])
  }
}

// POST: Crear un nuevo restaurante (solo ADMIN)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Solo ADMIN puede crear restaurantes
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear restaurantes.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    const restaurante = await prisma.restaurante.create({
      data: {
        nombre: body.nombre.trim(),
        ubicacion: toStringOrNull(body.ubicacion),
        activo: body.activo !== undefined ? Boolean(body.activo) : true,
      },
    })

    return NextResponse.json(restaurante, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/restaurantes:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear restaurante'
    if (error?.message) {
      if (error.message.includes('PrismaClient')) {
        errorMessage = 'Error de conexión con la base de datos'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}

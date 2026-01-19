// API Route para Empleados - Versión simplificada
import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los empleados (solo ADMIN)
export async function GET() {
  const user = await getCurrentUser()
  
  // Solo ADMIN puede ver empleados
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'No autorizado. Solo administradores pueden ver empleados.' },
      { status: 403 }
    )
  }
  try {
    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      include: {
        restaurantes: {
          include: {
            restaurante: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: 'asc' },
    })
    
    return NextResponse.json(empleados)
  } catch (error: any) {
    console.error('Error en GET /api/empleados:', error?.message || String(error))
    return NextResponse.json([])
  }
}

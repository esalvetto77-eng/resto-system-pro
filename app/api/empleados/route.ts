// API Route para Empleados - Versión simplificada
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Listar todos los empleados
export async function GET() {
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

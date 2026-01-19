// API Route para Recetas - Versión simplificada
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todas las recetas
export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      where: { activo: true },
      include: {
        ingredientes: {
          include: {
            producto: {
              include: {
                proveedores: {
                  include: {
                    proveedor: {
                      select: {
                        id: true,
                        nombre: true,
                      },
                    },
                  },
                  orderBy: {
                    ordenPreferencia: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(recetas)
  } catch (error: any) {
    console.error('Error en GET /api/recetas:', error?.message || String(error))
    return NextResponse.json([])
  }
}

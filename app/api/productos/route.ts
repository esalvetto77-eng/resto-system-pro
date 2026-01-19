// API Route para Productos - Versión simplificada
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
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
        inventario: true,
      },
      orderBy: { nombre: 'asc' },
    })
    
    return NextResponse.json(productos)
  } catch (error: any) {
    console.error('Error en GET /api/productos:', error?.message || String(error))
    return NextResponse.json([])
  }
}

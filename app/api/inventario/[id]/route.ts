// API Route para operaciones individuales de Inventario - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener inventario por ID de producto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inventario = await prisma.inventario.findUnique({
      where: { productoId: params.id },
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
              take: 1, // Solo el primer proveedor (preferido)
            },
          },
        },
      },
    })

    if (!inventario) {
      return NextResponse.json(
        { error: 'Inventario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(inventario)
  } catch (error: any) {
    console.error('Error en GET /api/inventario/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar stock actual
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validar que stockActual esté presente y sea un número válido
    if (body.stockActual === undefined || body.stockActual === null) {
      return NextResponse.json(
        { error: 'El stock actual es requerido' },
        { status: 400 }
      )
    }

    const stockActual = typeof body.stockActual === 'number' 
      ? body.stockActual 
      : parseFloat(String(body.stockActual))

    if (isNaN(stockActual) || stockActual < 0) {
      return NextResponse.json(
        { error: 'El stock actual debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
    })
    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el inventario existe, si no, crearlo
    let inventario = await prisma.inventario.findUnique({
      where: { productoId: params.id },
    })

    if (!inventario) {
      // Crear inventario si no existe
      inventario = await prisma.inventario.create({
        data: {
          productoId: params.id,
          stockActual: stockActual,
        },
        include: {
          producto: true,
        },
      })
    } else {
      // Actualizar inventario existente
      inventario = await prisma.inventario.update({
        where: { productoId: params.id },
        data: {
          stockActual: stockActual,
        },
        include: {
          producto: true,
        },
      })
    }

    return NextResponse.json(inventario)
  } catch (error: any) {
    console.error('Error en PUT /api/inventario/[id]:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al actualizar inventario', details: error?.message },
      { status: 500 }
    )
  }
}

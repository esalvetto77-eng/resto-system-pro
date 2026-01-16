// API Route para Pedidos - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Listar todos los pedidos
export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
          },
        },
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    })

    return NextResponse.json(pedidos)
  } catch (error: any) {
    console.error('Error en GET /api/pedidos:', error?.message || String(error))
    return NextResponse.json([])
  }
}

// POST: Crear un nuevo pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que proveedorId esté presente
    if (!body.proveedorId || typeof body.proveedorId !== 'string') {
      return NextResponse.json(
        { error: 'El proveedor es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: body.proveedorId },
    })
    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Validar items
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un item' },
        { status: 400 }
      )
    }

    // Verificar que todos los productos existen
    for (const item of body.items) {
      if (!item.productoId) {
        return NextResponse.json(
          { error: 'Todos los items deben tener un productoId' },
          { status: 400 }
        )
      }
      const producto = await prisma.producto.findUnique({
        where: { id: item.productoId },
      })
      if (!producto) {
        return NextResponse.json(
          { error: `Producto ${item.productoId} no encontrado` },
          { status: 404 }
        )
      }
    }

    // Crear pedido con items usando transacción
    const pedido = await prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          proveedorId: body.proveedorId,
          estado: body.estado || 'BORRADOR',
          fechaPedido: body.fechaPedido ? new Date(body.fechaPedido) : null,
          fechaEntrega: body.fechaEntrega ? new Date(body.fechaEntrega) : null,
          observaciones: body.observaciones || null,
          items: {
            create: body.items.map((item: any) => ({
              productoId: item.productoId,
              cantidadSugerida: item.cantidadSugerida || 0,
              cantidadFinal: item.cantidadFinal || item.cantidadSugerida || 0,
              precioUnitario: item.precioUnitario || null,
            })),
          },
        },
        include: {
          proveedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  unidad: true,
                },
              },
            },
          },
        },
      })

      return nuevoPedido
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/pedidos:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al crear pedido', details: error?.message },
      { status: 500 }
    )
  }
}

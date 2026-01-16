// API Route para Ventas Individuales
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// GET: Obtener una venta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo el dueño puede ver las ventas' },
        { status: 403 }
      )
    }

    const venta = await prisma.venta.findUnique({
      where: { id: params.id },
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(venta)
  } catch (error: any) {
    console.error('Error en GET /api/ventas/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener la venta' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar una venta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo el dueño puede editar las ventas' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validaciones
    if (!body.restauranteId || typeof body.restauranteId !== 'string') {
      return NextResponse.json(
        { error: 'El restaurante es requerido' },
        { status: 400 }
      )
    }

    if (!body.monto || typeof body.monto !== 'number' || body.monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número mayor a 0' },
        { status: 400 }
      )
    }

    if (!body.tipoTurno || !['DAY', 'NIGHT'].includes(body.tipoTurno)) {
      return NextResponse.json(
        { error: 'El tipo de turno debe ser DAY o NIGHT' },
        { status: 400 }
      )
    }

    // Verificar que el restaurante existe
    const restaurante = await prisma.restaurante.findUnique({
      where: { id: body.restauranteId },
    })

    if (!restaurante) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la venta existe
    const ventaExistente = await prisma.venta.findUnique({
      where: { id: params.id },
    })

    if (!ventaExistente) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Manejar la fecha correctamente para evitar problemas de zona horaria
    let fechaVenta: Date
    if (body.fecha) {
      const fechaStr = typeof body.fecha === 'string' ? body.fecha : body.fecha.toISOString()
      const fechaParte = fechaStr.split('T')[0] // "2026-01-15"
      const [year, month, day] = fechaParte.split('-').map(Number)
      // Crear fecha en hora local (no UTC) para evitar que cambie de día
      fechaVenta = new Date(year, month - 1, day, 12, 0, 0, 0)
    } else {
      fechaVenta = ventaExistente.fecha
    }

    // Actualizar la venta
    const venta = await prisma.venta.update({
      where: { id: params.id },
      data: {
        restauranteId: body.restauranteId,
        monto: body.monto,
        tipoTurno: body.tipoTurno,
        fecha: fechaVenta,
      },
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(venta)
  } catch (error: any) {
    console.error('Error en PUT /api/ventas/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al actualizar la venta' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar una venta (solo ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo el dueño puede eliminar las ventas' },
        { status: 403 }
      )
    }

    // Verificar que la venta existe
    const venta = await prisma.venta.findUnique({
      where: { id: params.id },
    })

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la venta (hard delete para ADMIN)
    await prisma.venta.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en DELETE /api/ventas/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar la venta' },
      { status: 500 }
    )
  }
}

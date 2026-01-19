// API Route para Ventas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST: Crear una venta (todos los roles pueden crear)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validaciones básicas
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

    // Manejar la fecha correctamente para evitar problemas de zona horaria
    let fechaVenta: Date
    if (body.fecha) {
      // Si viene una fecha ISO string (ej: "2026-01-15T00:00:00.000Z" o "2026-01-15")
      // Extraer solo la parte de fecha (YYYY-MM-DD) y crear fecha en hora local
      const fechaStr = typeof body.fecha === 'string' ? body.fecha : body.fecha.toISOString()
      const fechaParte = fechaStr.split('T')[0] // "2026-01-15"
      const [year, month, day] = fechaParte.split('-').map(Number)
      // Crear fecha en hora local (no UTC) para evitar que cambie de día
      fechaVenta = new Date(year, month - 1, day, 12, 0, 0, 0) // Mediodía para evitar problemas de zona horaria
      console.log('Fecha recibida:', fechaStr)
      console.log('Fecha parseada:', fechaParte)
      console.log('Fecha creada (local):', fechaVenta.toISOString())
      console.log('Fecha creada (local string):', fechaVenta.toLocaleString('es-AR'))
    } else {
      fechaVenta = new Date()
      console.log('Usando fecha actual:', fechaVenta.toISOString())
    }

    // Crear la venta
    const venta = await prisma.venta.create({
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

    return NextResponse.json(venta, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/ventas:', error?.message || String(error))
    console.error('Error completo:', error)
    console.error('Stack:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear venta'
    if (error?.message) {
      if (error.message.includes('Unknown model')) {
        errorMessage = 'Error: El modelo Venta no existe en la base de datos. Por favor, ejecuta las migraciones.'
      } else if (error.message.includes('PrismaClient')) {
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

// GET: Listar ventas (solo ADMIN/OWNER puede ver)
export async function GET(request: NextRequest) {
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

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const tipoTurno = searchParams.get('tipoTurno')

    // Construir filtros
    const where: any = {}
    if (restauranteId) where.restauranteId = restauranteId
    if (tipoTurno && ['DAY', 'NIGHT'].includes(tipoTurno)) {
      where.tipoTurno = tipoTurno
    }
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const fecha = new Date(fechaHasta)
        fecha.setHours(23, 59, 59, 999)
        where.fecha.lte = fecha
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json(ventas)
  } catch (error: any) {
    console.error('Error en GET /api/ventas:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  }
}

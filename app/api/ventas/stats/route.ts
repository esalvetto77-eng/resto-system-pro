// API Route para Estadísticas de Ventas (solo ADMIN/OWNER)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// GET: Obtener estadísticas de ventas
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
        { error: 'No autorizado. Solo el dueño puede ver las estadísticas' },
        { status: 403 }
      )
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Construir filtros de fecha (usar hora local)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)

    // Filtros base
    const baseWhere: any = {}
    if (restauranteId) baseWhere.restauranteId = restauranteId
    if (fechaDesde || fechaHasta) {
      baseWhere.fecha = {}
      if (fechaDesde) baseWhere.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const fecha = new Date(fechaHasta)
        fecha.setHours(23, 59, 59, 999)
        baseWhere.fecha.lte = fecha
      }
    }

    // Ventas del día (DAY)
    const ventasDayHoy = await prisma.venta.aggregate({
      where: {
        ...baseWhere,
        fecha: {
          gte: today,
          lt: tomorrow,
          ...(baseWhere.fecha || {}),
        },
        tipoTurno: 'DAY',
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    })

    // Ventas del día (NIGHT)
    const ventasNightHoy = await prisma.venta.aggregate({
      where: {
        ...baseWhere,
        fecha: {
          gte: today,
          lt: tomorrow,
          ...(baseWhere.fecha || {}),
        },
        tipoTurno: 'NIGHT',
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    })

    // Total diario
    const totalDiario = await prisma.venta.aggregate({
      where: {
        ...baseWhere,
        fecha: {
          gte: today,
          lt: tomorrow,
          ...(baseWhere.fecha || {}),
        },
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    })

    // Ventas mensuales (mes actual)
    const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1)
    const finMes = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    finMes.setHours(23, 59, 59, 999)

    const ventasMensuales = await prisma.venta.aggregate({
      where: {
        ...baseWhere,
        fecha: {
          gte: inicioMes,
          lte: finMes,
          ...(baseWhere.fecha || {}),
        },
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    })

    // Agregar datos por restaurante si no hay filtro
    let porRestaurante: any[] = []
    if (!restauranteId) {
      const restaurantes = await prisma.restaurante.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombre: true,
        },
      })

      for (const restaurante of restaurantes) {
        const stats = await prisma.venta.aggregate({
          where: {
            restauranteId: restaurante.id,
            fecha: fechaDesde || fechaHasta
              ? {
                  ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
                  ...(fechaHasta
                    ? {
                        lte: (() => {
                          const fecha = new Date(fechaHasta)
                          fecha.setHours(23, 59, 59, 999)
                          return fecha
                        })(),
                      }
                    : {}),
                }
              : {
                  gte: today,
                  lt: tomorrow,
                },
          },
          _sum: {
            monto: true,
          },
          _count: {
            id: true,
          },
        })

        porRestaurante.push({
          restaurante: {
            id: restaurante.id,
            nombre: restaurante.nombre,
          },
          total: stats._sum.monto || 0,
          cantidad: stats._count.id || 0,
        })
      }
    }

    const totalMensualConIva = ventasMensuales._sum.monto || 0
    const totalMensualSinIva = totalMensualConIva / 1.22

    return NextResponse.json({
      ventasDay: {
        monto: ventasDayHoy._sum.monto || 0,
        cantidad: ventasDayHoy._count.id || 0,
      },
      ventasNight: {
        monto: ventasNightHoy._sum.monto || 0,
        cantidad: ventasNightHoy._count.id || 0,
      },
      totalDiario: {
        monto: totalDiario._sum.monto || 0,
        cantidad: totalDiario._count.id || 0,
      },
      totalMensual: {
        monto: totalMensualConIva,
        cantidad: ventasMensuales._count.id || 0,
      },
      totalMensualSinIva: totalMensualSinIva,
      porRestaurante,
    })
  } catch (error: any) {
    console.error('Error en GET /api/ventas/stats:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}

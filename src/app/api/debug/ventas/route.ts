// Endpoint de debug para verificar ventas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Solo administradores pueden acceder' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')

    // Obtener TODAS las ventas
    const todasLasVentas = await prisma.venta.findMany({
      where: restauranteId ? { restauranteId } : {},
      select: {
        id: true,
        fecha: true,
        monto: true,
        tipoTurno: true,
        restauranteId: true,
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
      take: 100,
    })

    // Fecha de hoy
    const now = new Date()
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDay = now.getDate()

    // Filtrar ventas de hoy
    const ventasHoy = todasLasVentas.filter(v => {
      const ventaYear = v.fecha.getFullYear()
      const ventaMonth = v.fecha.getMonth()
      const ventaDay = v.fecha.getDate()
      return ventaYear === todayYear && ventaMonth === todayMonth && ventaDay === todayDay
    })

    // Calcular totales
    const ventasDay = ventasHoy
      .filter(v => v.tipoTurno === 'DAY')
      .reduce((sum, v) => sum + v.monto, 0)

    const ventasNight = ventasHoy
      .filter(v => v.tipoTurno === 'NIGHT')
      .reduce((sum, v) => sum + v.monto, 0)

    const totalDiario = ventasHoy.reduce((sum, v) => sum + v.monto, 0)

    return NextResponse.json({
      fechaHoy: {
        año: todayYear,
        mes: todayMonth + 1,
        día: todayDay,
        fechaCompleta: `${todayYear}/${todayMonth + 1}/${todayDay}`,
      },
      totalVentasEnBD: todasLasVentas.length,
      ventasHoy: ventasHoy.length,
      ventasHoyDetalle: ventasHoy.map(v => ({
        id: v.id,
        fecha: v.fecha.toISOString(),
        fechaLocal: v.fecha.toLocaleString('es-AR'),
        año: v.fecha.getFullYear(),
        mes: v.fecha.getMonth() + 1,
        día: v.fecha.getDate(),
        monto: v.monto,
        tipoTurno: v.tipoTurno,
        restaurante: v.restaurante.nombre,
      })),
      ultimas10Ventas: todasLasVentas.slice(0, 10).map(v => ({
        id: v.id,
        fecha: v.fecha.toISOString(),
        fechaLocal: v.fecha.toLocaleString('es-AR'),
        año: v.fecha.getFullYear(),
        mes: v.fecha.getMonth() + 1,
        día: v.fecha.getDate(),
        monto: v.monto,
        tipoTurno: v.tipoTurno,
        restaurante: v.restaurante.nombre,
      })),
      totales: {
        ventasDay,
        ventasNight,
        totalDiario,
      },
    })
  } catch (error: any) {
    console.error('Error en debug ventas:', error)
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}

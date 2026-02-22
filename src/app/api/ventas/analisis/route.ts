// API Route para Análisis de Ventas
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener datos de análisis de ventas
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
        { error: 'No autorizado. Solo el dueño puede ver los análisis' },
        { status: 403 }
      )
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(request.url)
    const restauranteId = searchParams.get('restauranteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Validar fechas
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Las fechas desde y hasta son requeridas' },
        { status: 400 }
      )
    }

    const fechaDesdeDate = new Date(fechaDesde)
    const fechaHastaDate = new Date(fechaHasta)
    fechaHastaDate.setHours(23, 59, 59, 999)

    // Construir filtros base
    const where: any = {
      fecha: {
        gte: fechaDesdeDate,
        lte: fechaHastaDate,
      },
    }
    if (restauranteId) where.restauranteId = restauranteId

    // Obtener todas las ventas del período
    const ventas = await prisma.venta.findMany({
      where,
      select: {
        id: true,
        fecha: true,
        monto: true,
        tipoTurno: true,
        canalVenta: true,
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    })

    // 1. Ventas por día de la semana
    const ventasPorDiaSemana: Record<string, { monto: number; cantidad: number }> = {
      'Lunes': { monto: 0, cantidad: 0 },
      'Martes': { monto: 0, cantidad: 0 },
      'Miércoles': { monto: 0, cantidad: 0 },
      'Jueves': { monto: 0, cantidad: 0 },
      'Viernes': { monto: 0, cantidad: 0 },
      'Sábado': { monto: 0, cantidad: 0 },
      'Domingo': { monto: 0, cantidad: 0 },
    }

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha)
      const diaSemana = diasSemana[fecha.getDay()]
      if (ventasPorDiaSemana[diaSemana]) {
        ventasPorDiaSemana[diaSemana].monto += venta.monto
        ventasPorDiaSemana[diaSemana].cantidad += 1
      }
    })

    // 2. Evolución de ventas por mes
    const ventasPorMes: Record<string, { monto: number; cantidad: number }> = {}
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha)
      const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const mesNombre = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      
      if (!ventasPorMes[mesAno]) {
        ventasPorMes[mesAno] = { monto: 0, cantidad: 0 }
      }
      ventasPorMes[mesAno].monto += venta.monto
      ventasPorMes[mesAno].cantidad += 1
    })

    // 3. Ventas por turno
    const ventasPorTurno: Record<string, { monto: number; cantidad: number }> = {
      'DAY': { monto: 0, cantidad: 0 },
      'NIGHT': { monto: 0, cantidad: 0 },
    }
    ventas.forEach(venta => {
      if (ventasPorTurno[venta.tipoTurno]) {
        ventasPorTurno[venta.tipoTurno].monto += venta.monto
        ventasPorTurno[venta.tipoTurno].cantidad += 1
      }
    })

    // 4. Ventas por canal
    const ventasPorCanal: Record<string, { monto: number; cantidad: number }> = {}
    ventas.forEach(venta => {
      const canal = venta.canalVenta || 'Sin Canal'
      if (!ventasPorCanal[canal]) {
        ventasPorCanal[canal] = { monto: 0, cantidad: 0 }
      }
      ventasPorCanal[canal].monto += venta.monto
      ventasPorCanal[canal].cantidad += 1
    })

    // 5. Ventas por restaurante
    const ventasPorRestaurante: Record<string, { monto: number; cantidad: number; nombre: string }> = {}
    ventas.forEach(venta => {
      const restauranteId = venta.restaurante.id
      if (!ventasPorRestaurante[restauranteId]) {
        ventasPorRestaurante[restauranteId] = {
          monto: 0,
          cantidad: 0,
          nombre: venta.restaurante.nombre,
        }
      }
      ventasPorRestaurante[restauranteId].monto += venta.monto
      ventasPorRestaurante[restauranteId].cantidad += 1
    })

    // 6. Evolución diaria (para gráfica de tendencia)
    const ventasPorDia: Record<string, { monto: number; cantidad: number }> = {}
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha)
      const diaStr = fecha.toISOString().split('T')[0] // YYYY-MM-DD
      if (!ventasPorDia[diaStr]) {
        ventasPorDia[diaStr] = { monto: 0, cantidad: 0 }
      }
      ventasPorDia[diaStr].monto += venta.monto
      ventasPorDia[diaStr].cantidad += 1
    })

    // Convertir a arrays para las gráficas
    const ventasPorDiaSemanaArray = Object.entries(ventasPorDiaSemana).map(([dia, datos]) => ({
      dia,
      monto: datos.monto,
      cantidad: datos.cantidad,
    }))

    const ventasPorMesArray = Object.entries(ventasPorMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mesAno, datos]) => {
        const [ano, mes] = mesAno.split('-')
        const fecha = new Date(parseInt(ano), parseInt(mes) - 1, 1)
        return {
          mes: fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
          monto: datos.monto,
          cantidad: datos.cantidad,
        }
      })

    const ventasPorTurnoArray = Object.entries(ventasPorTurno).map(([turno, datos]) => ({
      turno: turno === 'DAY' ? 'Día' : 'Noche',
      monto: datos.monto,
      cantidad: datos.cantidad,
    }))

    const ventasPorCanalArray = Object.entries(ventasPorCanal)
      .sort(([, a], [, b]) => b.monto - a.monto)
      .map(([canal, datos]) => ({
        canal,
        monto: datos.monto,
        cantidad: datos.cantidad,
      }))

    const ventasPorRestauranteArray = Object.entries(ventasPorRestaurante)
      .sort(([, a], [, b]) => b.monto - a.monto)
      .map(([id, datos]) => ({
        id,
        nombre: datos.nombre,
        monto: datos.monto,
        cantidad: datos.cantidad,
      }))

    const ventasPorDiaArray = Object.entries(ventasPorDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, datos]) => ({
        dia,
        monto: datos.monto,
        cantidad: datos.cantidad,
      }))

    // Calcular totales
    const totalMonto = ventas.reduce((sum, v) => sum + v.monto, 0)
    const totalCantidad = ventas.length
    const promedioDiario = ventasPorDiaArray.length > 0 
      ? totalMonto / ventasPorDiaArray.length 
      : 0

    return NextResponse.json({
      ventasPorDiaSemana: ventasPorDiaSemanaArray,
      ventasPorMes: ventasPorMesArray,
      ventasPorTurno: ventasPorTurnoArray,
      ventasPorCanal: ventasPorCanalArray,
      ventasPorRestaurante: ventasPorRestauranteArray,
      ventasPorDia: ventasPorDiaArray,
      totales: {
        monto: totalMonto,
        cantidad: totalCantidad,
        promedioDiario,
      },
    })
  } catch (error: any) {
    console.error('Error en GET /api/ventas/analisis:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al obtener análisis de ventas' },
      { status: 500 }
    )
  }
}

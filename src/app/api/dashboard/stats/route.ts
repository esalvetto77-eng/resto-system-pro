// API Route para estadísticas del Dashboard
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { calcularEstadoInventario } from '@/lib/utils'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restauranteId = searchParams.get('restauranteId')

    // Obtener usuario actual para verificar permisos
    const user = await getCurrentUser()
    const userIsAdmin = isAdmin(user)

    // Contar empleados activos solo si el usuario es ADMIN
    // Los encargados NO deben ver información de empleados
    let empleadosActivos = 0
    if (userIsAdmin) {
      const empleadosWhere: any = { activo: true }
      if (restauranteId) {
        empleadosWhere.OR = [
          {
            restaurantes: {
              some: {
                restauranteId: restauranteId,
              },
            },
          },
          {
            restaurantes: {
              none: {}, // Empleados globales (sin relación con ningún restaurante)
            },
          },
        ]
      }
      
      empleadosActivos = await prisma.empleado.count({
        where: empleadosWhere,
      })
    }

    // Contar proveedores activos
    const proveedoresActivos = await prisma.proveedor.count({
      where: { activo: true },
    })

    // Contar productos activos
    const productosActivos = await prisma.producto.count({
      where: { activo: true },
    })

    // Obtener inventario completo para calcular estados
    const inventario = await prisma.inventario.findMany({
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            stockMinimo: true,
            activo: true,
          },
        },
      },
    })

    // Productos en reposición
    const productosReposicion = inventario.filter((item) => {
      if (!item.producto || !item.producto.activo) return false
      return (
        calcularEstadoInventario(
          item.stockActual,
          item.producto.stockMinimo
        ) === 'REPOSICION'
      )
    }).length

    // Productos OK
    const productosOK = inventario.filter((item) => {
      if (!item.producto || !item.producto.activo) return false
      return (
        calcularEstadoInventario(
          item.stockActual,
          item.producto.stockMinimo
        ) === 'OK'
      )
    }).length

    // Contar pedidos pendientes (no completados)
    const pedidosPendientes = await prisma.pedido.count({
      where: {
        estado: {
          not: 'COMPLETADO',
        },
      },
    })

    // Contar restaurantes activos
    const restaurantesActivos = await prisma.restaurante.count({
      where: { activo: true },
    })

    // Estadísticas de ventas (solo ADMIN)
    let ventasStats = {
      ventasDay: 0,
      ventasNight: 0,
      totalDiario: 0,
      totalMensual: 0,
      totalMensualSinIva: 0,
    }

    if (userIsAdmin) {
      // Ventas del día (hoy)
      // Obtener la fecha de hoy en formato YYYY-MM-DD para comparar solo la fecha, sin hora
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      console.log('Fecha de hoy (inicio):', todayStart.toISOString())
      console.log('Fecha de hoy (fin):', todayEnd.toISOString())

      // Obtener todas las ventas del mes para debug
      const todasLasVentas = await prisma.venta.findMany({
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipoTurno: true,
        },
        orderBy: {
          fecha: 'desc',
        },
        take: 20,
      })
      console.log('Últimas 20 ventas en la BD:', todasLasVentas.map(v => ({
        fecha: v.fecha.toISOString(),
        fechaLocal: v.fecha.toLocaleString('es-AR'),
        monto: v.monto,
        tipoTurno: v.tipoTurno,
      })))

      // Crear rango de fechas para comparar correctamente
      // Usar el mismo método que al guardar: fecha en hora local a mediodía
      const todayStartForQuery = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const todayEndForQuery = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      const whereVentas: any = {
        fecha: {
          gte: todayStartForQuery,
          lte: todayEndForQuery,
        },
      }
      if (restauranteId) {
        whereVentas.restauranteId = restauranteId
      }

      // Obtener todas las ventas de hoy para verificar
      const ventasHoyTest = await prisma.venta.findMany({
        where: whereVentas,
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipoTurno: true,
        },
        take: 10,
      })
      console.log('Fecha de inicio (todayStart):', todayStart.toISOString())
      console.log('Fecha de fin (todayEnd):', todayEnd.toISOString())
      console.log('Ventas encontradas para hoy (primeras 10):', ventasHoyTest.map(v => ({
        id: v.id,
        fecha: v.fecha.toISOString(),
        fechaLocal: v.fecha.toLocaleString('es-AR'),
        monto: v.monto,
        tipoTurno: v.tipoTurno,
      })))

      // Ventas del día (DAY)
      const ventasDay = await prisma.venta.aggregate({
        where: {
          ...whereVentas,
          tipoTurno: 'DAY',
        },
        _sum: {
          monto: true,
        },
      })

      // Ventas del día (NIGHT)
      const ventasNight = await prisma.venta.aggregate({
        where: {
          ...whereVentas,
          tipoTurno: 'NIGHT',
        },
        _sum: {
          monto: true,
        },
      })

      // Total diario
      const totalDiario = await prisma.venta.aggregate({
        where: whereVentas,
        _sum: {
          monto: true,
        },
      })
      
      console.log('Agregados calculados:')
      console.log('- Ventas DAY:', ventasDay._sum.monto)
      console.log('- Ventas NIGHT:', ventasNight._sum.monto)
      console.log('- Total Diario:', totalDiario._sum.monto)

      // Total mensual
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
      const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      finMes.setHours(23, 59, 59, 999)

      const whereVentasMes: any = {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
      }
      if (restauranteId) {
        whereVentasMes.restauranteId = restauranteId
      }

      const totalMensual = await prisma.venta.aggregate({
        where: whereVentasMes,
        _sum: {
          monto: true,
        },
      })

      const totalMensualConIva = totalMensual._sum.monto || 0
      const totalMensualSinIva = totalMensualConIva / 1.22

      ventasStats = {
        ventasDay: ventasDay._sum.monto || 0,
        ventasNight: ventasNight._sum.monto || 0,
        totalDiario: totalDiario._sum.monto || 0,
        totalMensual: totalMensualConIva,
        totalMensualSinIva: totalMensualSinIva,
      }
      
      // Log para depuración
      console.log('Estadísticas de ventas calculadas:', ventasStats)
      console.log('Total mensual calculado:', totalMensual._sum.monto)
      console.log('Fecha inicio mes:', inicioMes.toISOString())
      console.log('Fecha fin mes:', finMes.toISOString())
    }

    // Estadísticas de pagos pendientes (solo ADMIN)
    let pagosPendientesStats = {
      totalPendiente: 0,
      cantidadPendientes: 0,
    }

    if (userIsAdmin) {
      const pagosPendientes = await prisma.pagoPendiente.findMany({
        where: { pagado: false },
        select: {
          monto: true,
        },
      })

      pagosPendientesStats = {
        totalPendiente: pagosPendientes.reduce((sum, p) => sum + p.monto, 0),
        cantidadPendientes: pagosPendientes.length,
      }
    }

    return NextResponse.json({
      empleadosActivos,
      proveedoresActivos,
      productosActivos,
      productosReposicion,
      productosOK,
      pedidosPendientes,
      restaurantesActivos,
      ...ventasStats,
      ...pagosPendientesStats,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error)
    return NextResponse.json(
      {
        empleadosActivos: 0,
        proveedoresActivos: 0,
        productosActivos: 0,
        productosReposicion: 0,
        productosOK: 0,
        pedidosPendientes: 0,
        restaurantesActivos: 0,
        ventasDay: 0,
        ventasNight: 0,
        totalDiario: 0,
        totalMensual: 0,
        totalMensualSinIva: 0,
        totalPendiente: 0,
        cantidadPendientes: 0,
      },
      { status: 500 }
    )
  }
}

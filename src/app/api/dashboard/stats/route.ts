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
      const now = new Date()
      const todayYear = now.getFullYear()
      const todayMonth = now.getMonth()
      const todayDay = now.getDate()

      console.log('=== DEBUG VENTAS DASHBOARD ===')
      console.log('Usuario es ADMIN:', userIsAdmin)
      console.log('Fecha de hoy:', `${todayYear}/${todayMonth + 1}/${todayDay}`)
      console.log('Restaurante ID filtro:', restauranteId)
      
      // Obtener TODAS las ventas (sin límite para asegurar que obtenemos todas)
      // Si hay restauranteId, filtrar por él, sino obtener todas
      const todasLasVentas = await prisma.venta.findMany({
        where: restauranteId ? { restauranteId } : {},
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipoTurno: true,
          restauranteId: true,
        },
        orderBy: {
          fecha: 'desc',
        },
      })
      
      // También obtener ventas sin filtro para debug
      const todasLasVentasSinFiltro = await prisma.venta.findMany({
        select: {
          id: true,
          fecha: true,
          monto: true,
          tipoTurno: true,
          restauranteId: true,
        },
        orderBy: {
          fecha: 'desc',
        },
        take: 10,
      })
      
      console.log('Ventas con filtro de restaurante:', todasLasVentas.length)
      console.log('Total ventas sin filtro (primeras 10):', todasLasVentasSinFiltro.length)
      
      console.log('Total ventas en BD:', todasLasVentas.length)
      
      if (todasLasVentas.length > 0) {
        console.log('Últimas 5 ventas en la BD:', todasLasVentas.slice(0, 5).map(v => ({
          id: v.id,
          fecha: v.fecha.toISOString(),
          fechaLocal: v.fecha.toLocaleString('es-AR'),
          año: v.fecha.getFullYear(),
          mes: v.fecha.getMonth() + 1,
          día: v.fecha.getDate(),
          monto: v.monto,
          tipoTurno: v.tipoTurno,
          restauranteId: v.restauranteId,
        })))
      }
      
      // Filtrar en memoria las ventas de hoy
      const ventasHoy = todasLasVentas.filter(v => {
        const ventaYear = v.fecha.getFullYear()
        const ventaMonth = v.fecha.getMonth()
        const ventaDay = v.fecha.getDate()
        const esHoy = ventaYear === todayYear && ventaMonth === todayMonth && ventaDay === todayDay
        return esHoy
      })
      
      console.log('Ventas filtradas para hoy:', ventasHoy.length)
      if (ventasHoy.length > 0) {
        console.log('Ventas de hoy:', ventasHoy.map(v => ({
          id: v.id,
          fecha: v.fecha.toLocaleString('es-AR'),
          monto: v.monto,
          tipoTurno: v.tipoTurno,
        })))
      }

      // Calcular totales directamente desde las ventas filtradas
      const ventasDay = ventasHoy
        .filter(v => v.tipoTurno === 'DAY')
        .reduce((sum, v) => sum + v.monto, 0)

      const ventasNight = ventasHoy
        .filter(v => v.tipoTurno === 'NIGHT')
        .reduce((sum, v) => sum + v.monto, 0)

      const totalDiario = ventasHoy.reduce((sum, v) => sum + v.monto, 0)
      
      console.log('Totales calculados:')
      console.log('- Ventas DAY:', ventasDay)
      console.log('- Ventas NIGHT:', ventasNight)
      console.log('- Total Diario:', totalDiario)

      // Total mensual - calcular desde todas las ventas filtradas en memoria
      const mesActual = now.getMonth()
      const añoActual = now.getFullYear()
      
      const ventasDelMes = todasLasVentas.filter(v => {
        const ventaYear = v.fecha.getFullYear()
        const ventaMonth = v.fecha.getMonth()
        return ventaYear === añoActual && ventaMonth === mesActual
      })
      
      const totalMensualConIva = ventasDelMes.reduce((sum, v) => sum + v.monto, 0)
      const totalMensualSinIva = totalMensualConIva / 1.22
      
      console.log('Ventas del mes actual:', ventasDelMes.length)
      console.log('Total mensual con IVA:', totalMensualConIva)
      console.log('Total mensual sin IVA:', totalMensualSinIva)

      ventasStats = {
        ventasDay: ventasDay,
        ventasNight: ventasNight,
        totalDiario: totalDiario,
        totalMensual: totalMensualConIva,
        totalMensualSinIva: totalMensualSinIva,
      }
      
      // Log para depuración
      console.log('=== ESTADÍSTICAS FINALES DE VENTAS ===')
      console.log('Estadísticas de ventas calculadas:', JSON.stringify(ventasStats, null, 2))
      console.log('Ventas del día:', ventasHoy.length)
      console.log('Ventas del mes:', ventasDelMes.length)
      console.log('Total mensual calculado:', totalMensualConIva)
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

    const response = {
      empleadosActivos,
      proveedoresActivos,
      productosActivos,
      productosReposicion,
      productosOK,
      pedidosPendientes,
      restaurantesActivos,
      ...ventasStats,
      ...pagosPendientesStats,
    }
    
    console.log('=== RESPUESTA FINAL DEL ENDPOINT ===')
    console.log('Response completo:', JSON.stringify(response, null, 2))
    console.log('ventasStats en response:', response.ventasDay, response.ventasNight, response.totalDiario, response.totalMensual, response.totalMensualSinIva)
    
    return NextResponse.json(response)
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

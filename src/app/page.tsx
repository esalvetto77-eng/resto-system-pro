'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateShort } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  empleadosActivos: number
  proveedoresActivos: number
  productosActivos: number
  productosReposicion: number
  productosOK: number
  pedidosPendientes: number
  restaurantesActivos: number
  ventasDay?: number
  ventasNight?: number
  totalDiario?: number
  totalMensual?: number
  totalMensualSinIva?: number
  totalPendiente?: number
  cantidadPendientes?: number
}

interface AlertaCarnet {
  empleadoId: string
  nombre: string
  alertas: Array<{
    tipo: 'manipulacion' | 'salud'
    fechaVencimiento: string
    diasRestantes: number
  }>
}

export default function HomePage() {
  const { restauranteActivo, loading: loadingRestaurante } = useRestaurante()
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertasCarnets, setAlertasCarnets] = useState<AlertaCarnet[]>([])
  const [loadingAlertas, setLoadingAlertas] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Agregar timeout de 8 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const url = restauranteActivo?.id
        ? `/api/dashboard/stats?restauranteId=${restauranteActivo.id}`
        : '/api/dashboard/stats'
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('=== ESTADÍSTICAS RECIBIDAS DEL SERVIDOR ===')
      console.log('Datos completos:', JSON.stringify(data, null, 2))
      console.log('Total mensual en data:', data.totalMensual)
      console.log('Total mensual sin IVA en data:', data.totalMensualSinIva)
      console.log('Total diario en data:', data.totalDiario)
      console.log('Ventas día en data:', data.ventasDay)
      console.log('Ventas noche en data:', data.ventasNight)
      console.log('Tipo de totalMensual:', typeof data.totalMensual)
      setStats(data)
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error)
      if (error.name === 'AbortError') {
        console.error('Timeout: La petición tardó demasiado')
      }
      // Establecer valores por defecto en caso de error
      setStats({
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
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAlertasCarnets = async () => {
    if (!isAdmin()) {
      console.log('[ALERTAS] Usuario no es admin, no se cargan alertas')
      return // Solo admins pueden ver alertas de carnets
    }
    
    try {
      setLoadingAlertas(true)
      console.log('[ALERTAS] Cargando alertas de carnets...')
      const response = await fetch('/api/empleados/carnets-por-vencer')
      console.log('[ALERTAS] Response status:', response.status)
      
      const data = await response.json()
      console.log('[ALERTAS] Datos recibidos:', data)
      
      if (response.ok) {
        console.log('[ALERTAS] Total empleados con alertas:', data.total)
        console.log('[ALERTAS] Empleados:', data.empleados)
        setAlertasCarnets(data.empleados || [])
      } else {
        console.error('[ALERTAS] Error en la respuesta:', response.status, data)
        // Si hay error, establecer array vacío para que no se muestre nada
        setAlertasCarnets([])
      }
    } catch (error) {
      console.error('[ALERTAS] Error al cargar alertas de carnets:', error)
    } finally {
      setLoadingAlertas(false)
    }
  }

  useEffect(() => {
    // No esperar si ya hay restaurante o si ya pasó suficiente tiempo
    fetchStats()
    fetchAlertasCarnets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restauranteActivo?.id])
  
  // También intentar cargar después de un tiempo si no hay restaurante
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!stats && !loading) {
        fetchStats()
      }
    }, 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Valores por defecto si no hay stats (debe estar antes de kpiCards)
  const statsToShow = stats || {
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
  }

  // Log para depuración
  console.log('statsToShow en dashboard:', statsToShow)
  console.log('totalMensual en statsToShow:', statsToShow.totalMensual)

  const kpiCards = [
    // Solo ADMIN puede ver información de empleados
    ...(isAdmin() ? [{
      title: 'Empleados Activos',
      value: statsToShow.empleadosActivos,
      color: 'bg-terracotta-50 border-terracotta-200',
      textColor: 'text-terracotta-700',
      href: '/empleados',
    }] : []),
    {
      title: 'Proveedores',
      value: statsToShow.proveedoresActivos,
      color: 'bg-clay-50 border-clay-200',
      textColor: 'text-clay-700',
      href: '/proveedores',
    },
    {
      title: 'Productos Activos',
      value: statsToShow.productosActivos,
      color: 'bg-paper-50 border-paper-200',
      textColor: 'text-paper-700',
      href: '/productos',
    },
    {
      title: 'Productos OK',
      value: statsToShow.productosOK,
      color: 'bg-neutral-50 border-neutral-200',
      textColor: 'text-neutral-700',
      href: '/inventario',
    },
    {
      title: 'Necesitan Reposición',
      value: statsToShow.productosReposicion,
      color: 'bg-paper-100 border-paper-300',
      textColor: 'text-paper-800',
      href: '/inventario',
      alert: statsToShow.productosReposicion > 0,
    },
    {
      title: 'Pedidos Pendientes',
      value: statsToShow.pedidosPendientes,
      color: 'bg-clay-50 border-clay-200',
      textColor: 'text-clay-700',
      href: '/pedidos',
    },
    // Solo ADMIN puede ver métricas de ventas
    ...(isAdmin() ? [
      {
        title: 'Ventas Día (Hoy)',
        value: Number(statsToShow.ventasDay) || 0,
        color: 'bg-terracotta-50 border-terracotta-200',
        textColor: 'text-terracotta-700',
        href: '/ventas',
        formatCurrency: true,
      },
      {
        title: 'Ventas Noche (Hoy)',
        value: Number(statsToShow.ventasNight) || 0,
        color: 'bg-neutral-50 border-neutral-300',
        textColor: 'text-neutral-700',
        href: '/ventas',
        formatCurrency: true,
      },
      {
        title: 'Total Diario',
        value: Number(statsToShow.totalDiario) || 0,
        color: 'bg-terracotta-100 border-terracotta-300',
        textColor: 'text-terracotta-800',
        href: '/ventas',
        formatCurrency: true,
      },
      {
        title: 'Total Mensual',
        value: Number(statsToShow.totalMensual) || 0,
        color: 'bg-terracotta-50 border-terracotta-200',
        textColor: 'text-terracotta-700',
        href: '/ventas',
        formatCurrency: true,
      },
      {
        title: 'Total Mensual sin IVA',
        value: Number(statsToShow.totalMensualSinIva) || 0,
        color: 'bg-terracotta-50 border-terracotta-200',
        textColor: 'text-terracotta-700',
        href: '/ventas',
        formatCurrency: true,
      },
      {
        title: 'Pagos Pendientes',
        value: Number(statsToShow.totalPendiente) || 0,
        color: 'bg-paper-100 border-paper-300',
        textColor: 'text-paper-800',
        href: '/pagos-pendientes',
        formatCurrency: true,
        alert: (statsToShow.cantidadPendientes || 0) > 0,
        subtitle: `${statsToShow.cantidadPendientes || 0} ${(statsToShow.cantidadPendientes || 0) === 1 ? 'pago' : 'pagos'}`,
      },
    ] : []),
  ]

  const quickActions = [
    // Solo ADMIN puede crear empleados
    ...(isAdmin() ? [{
      name: 'Nuevo Empleado',
      href: '/empleados/nuevo',
      description: 'Agregar empleado',
    }] : []),
    {
      name: 'Nuevo Proveedor',
      href: '/proveedores/nuevo',
      description: 'Agregar proveedor',
    },
    {
      name: 'Nuevo Producto',
      href: '/productos/nuevo',
      description: 'Agregar producto',
    },
    {
      name: 'Nuevo Pedido',
      href: '/pedidos/nuevo',
      description: 'Crear pedido',
    },
    {
      name: 'Ver Inventario',
      href: '/inventario',
      description: 'Control de stock',
    },
    {
      name: 'Ver Turnos',
      href: '/turnos',
      description: 'Planilla semanal',
    },
    {
      name: 'Nueva Venta',
      href: '/ventas/nuevo',
      description: 'Registrar venta',
    },
    // Solo ADMIN puede gestionar pagos pendientes
    ...(isAdmin() ? [{
      name: 'Nuevo Pago Pendiente',
      href: '/pagos-pendientes/nuevo',
      description: 'Registrar pago a proveedor',
    }] : []),
  ]

  // Mostrar loading solo si realmente está cargando y no hay datos
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-neutral-500 mb-2" style={{ fontWeight: 400, lineHeight: 1.6 }}>
            {loadingRestaurante ? 'Cargando restaurantes...' : 'Cargando estadísticas...'}
          </div>
          <div className="text-xs text-neutral-400" style={{ fontWeight: 300, lineHeight: 1.6 }}>Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
              <h1 className="text-3xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Dashboard
              </h1>
        <p className="text-neutral-600">
          Resumen general del sistema de gestión
          {restauranteActivo && (
            <span className="ml-2">
              - <Badge variant="primary">{restauranteActivo.nombre}</Badge>
            </span>
          )}
        </p>
      </div>

      {/* Alertas de Carnets por Vencer */}
      {isAdmin() && (
        <>
          {loadingAlertas && (
            <Card className="border-neutral-200 bg-neutral-50">
              <CardBody className="p-4">
                <p className="text-sm text-neutral-600">Cargando alertas de carnets...</p>
              </CardBody>
            </Card>
          )}
          
          {!loadingAlertas && alertasCarnets.length === 0 && (
            <Card className="border-neutral-200 bg-neutral-50">
              <CardBody className="p-4">
                <p className="text-sm text-neutral-600">
                  ✅ No hay carnets por vencer en los próximos 15 días
                </p>
              </CardBody>
            </Card>
          )}

          {!loadingAlertas && alertasCarnets.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-yellow-900" style={{ fontWeight: 600 }}>
                ⚠️ Alertas: Carnets por Vencer (15 días)
              </h2>
              <Badge variant="warning">{alertasCarnets.length} {alertasCarnets.length === 1 ? 'empleado' : 'empleados'}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {alertasCarnets.map((alerta) => (
                <div
                  key={alerta.empleadoId}
                  className="p-4 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/empleados/${alerta.empleadoId}`}
                        className="font-semibold text-neutral-900 hover:text-terracotta-600 transition-colors"
                      >
                        {alerta.nombre}
                      </Link>
                      <div className="mt-2 space-y-1">
                        {alerta.alertas.map((a, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge
                              variant={a.diasRestantes <= 7 ? 'error' : 'warning'}
                              className="text-xs"
                            >
                              {a.tipo === 'manipulacion' ? 'Carnet Manipulación' : 'Carnet Salud'}
                            </Badge>
                            <span className="text-neutral-700">
                              Vence: {formatDateShort(a.fechaVencimiento)}
                            </span>
                            <span className="text-neutral-500">
                              ({a.diasRestantes} {a.diasRestantes === 1 ? 'día' : 'días'} restantes)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link href={`/empleados/${alerta.empleadoId}`}>
                      <Button size="sm" variant="secondary">
                        Ver Empleado
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
          )}
        </>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi) => (
          <Link key={kpi.title} href={kpi.href}>
            <Card className={`${kpi.color} hover:border-terracotta-300 transition-all duration-200 cursor-pointer border-2 ${kpi.alert ? 'border-paper-400' : ''}`}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600 mb-2" style={{ fontWeight: 500, lineHeight: 1.6 }}>
                      {kpi.title}
                    </p>
                    <p className={`text-3xl font-semibold ${kpi.textColor}`} style={{ fontWeight: 600, lineHeight: 1.5 }}>
                      {(kpi as any).formatCurrency 
                        ? new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(kpi.value)
                        : kpi.value.toLocaleString()}
                    </p>
                    {(kpi as any).subtitle && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {(kpi as any).subtitle}
                      </p>
                    )}
                    {kpi.alert && (
                      <Badge variant="warning" className="mt-3">
                        Requiere atención
                      </Badge>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Acciones Rápidas
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className="p-4 rounded-soft border border-neutral-200 hover:bg-neutral-50 hover:border-terracotta-300 transition-all duration-200 cursor-pointer">
                  <p className="font-medium mb-1" style={{ fontWeight: 500, color: '#111111', lineHeight: 1.6 }}>
                    {action.name}
                  </p>
                  <p className="text-sm text-neutral-500" style={{ fontWeight: 400, lineHeight: 1.6 }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Info Card */}
      <Card className="bg-terracotta-50 border-terracotta-200">
        <CardBody className="p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-terracotta-900 mb-2">
                Bienvenido al Sistema de Gestión
              </h3>
              <p className="text-terracotta-700 text-sm mb-4">
                Desde aquí puedes gestionar todos los aspectos de tu restaurante:
                empleados, proveedores, inventario, pedidos y liquidaciones.
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Solo ADMIN puede ver empleados */}
                {isAdmin() && (
                  <Link href="/empleados">
                    <Button size="sm" variant="secondary">
                      Ver Empleados
                    </Button>
                  </Link>
                )}
                <Link href="/inventario">
                  <Button size="sm" variant="secondary">
                    Ver Inventario
                  </Button>
                </Link>
                <Link href="/turnos">
                  <Button size="sm" variant="secondary">
                    Ver Turnos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

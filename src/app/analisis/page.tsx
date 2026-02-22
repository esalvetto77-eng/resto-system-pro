'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalisisData {
  ventasPorDiaSemana: Array<{ dia: string; monto: number; cantidad: number }>
  ventasPorMes: Array<{ mes: string; monto: number; cantidad: number }>
  ventasPorTurno: Array<{ turno: string; monto: number; cantidad: number }>
  ventasPorCanal: Array<{ canal: string; monto: number; cantidad: number }>
  ventasPorRestaurante: Array<{ id: string; nombre: string; monto: number; cantidad: number }>
  ventasPorDia: Array<{ dia: string; monto: number; cantidad: number }>
  totales: {
    monto: number
    cantidad: number
    promedioDiario: number
  }
}

const COLORS = ['#9d7f65', '#8a6d57', '#705849', '#b89d84', '#d4c4b0', '#e8ddd0', '#f5f0eb']

export default function AnalisisPage() {
  const router = useRouter()
  const { restaurantes } = useRestaurante()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalisisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Fechas por defecto: último mes
  const hoy = new Date()
  const haceUnMes = new Date()
  haceUnMes.setMonth(haceUnMes.getMonth() - 1)
  
  const [fechaDesde, setFechaDesde] = useState(
    haceUnMes.toISOString().split('T')[0]
  )
  const [fechaHasta, setFechaHasta] = useState(
    hoy.toISOString().split('T')[0]
  )
  const [restauranteFiltro, setRestauranteFiltro] = useState<string>('')

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/')
      return
    }
    fetchAnalisis()
  }, [fechaDesde, fechaHasta, restauranteFiltro])

  async function fetchAnalisis() {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('fechaDesde', fechaDesde)
      params.append('fechaHasta', fechaHasta)
      if (restauranteFiltro) {
        params.append('restauranteId', restauranteFiltro)
      }

      const response = await fetch(`/api/ventas/analisis?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al cargar análisis')
      }

      const analisisData = await response.json()
      setData(analisisData)
    } catch (error: any) {
      console.error('Error al cargar análisis:', error)
      setError(error?.message || 'Error al cargar los datos de análisis')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Configurar períodos rápidos
  const setPeriodo = (dias: number) => {
    const hasta = new Date()
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    setFechaDesde(desde.toISOString().split('T')[0])
    setFechaHasta(hasta.toISOString().split('T')[0])
  }

  if (!isAdmin()) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
          Análisis de Ventas
        </h1>
        <p className="text-neutral-600 mt-1">
          Gráficas y estadísticas de ventas por período
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Restaurante
              </label>
              <select
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={restauranteFiltro}
                onChange={(e) => setRestauranteFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                {restaurantes.map((restaurante) => (
                  <option key={restaurante.id} value={restaurante.id}>
                    {restaurante.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Períodos Rápidos
              </label>
              <select
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                onChange={(e) => {
                  if (e.target.value) {
                    setPeriodo(parseInt(e.target.value))
                    e.target.value = ''
                  }
                }}
                defaultValue=""
              >
                <option value="">Seleccionar...</option>
                <option value="7">Últimos 7 días</option>
                <option value="15">Últimos 15 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="60">Últimos 60 días</option>
                <option value="90">Últimos 90 días</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Totales */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="text-sm font-medium text-neutral-500 mb-1">
                Total de Ventas
              </div>
              <div className="text-2xl font-semibold text-[#111111]">
                {formatCurrency(data.totales.monto)}
              </div>
              <div className="text-sm text-neutral-600 mt-1">
                {data.totales.cantidad} {data.totales.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm font-medium text-neutral-500 mb-1">
                Promedio Diario
              </div>
              <div className="text-2xl font-semibold text-[#111111]">
                {formatCurrency(data.totales.promedioDiario)}
              </div>
              <div className="text-sm text-neutral-600 mt-1">
                Por día en el período
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm font-medium text-neutral-500 mb-1">
                Días Analizados
              </div>
              <div className="text-2xl font-semibold text-[#111111]">
                {data.ventasPorDia.length}
              </div>
              <div className="text-sm text-neutral-600 mt-1">
                Días con ventas registradas
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-neutral-600">Cargando análisis...</div>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-red-600">{error}</div>
          </CardBody>
        </Card>
      )}

      {/* Gráficas */}
      {data && !loading && (
        <>
          {/* Gráfica 1: Ventas por Día de la Semana */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]">
                Ventas por Día de la Semana
              </h2>
              <p className="text-sm text-neutral-600">
                Qué días de la semana se vende más
              </p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ventasPorDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                    labelStyle={{ color: '#111111' }}
                  />
                  <Legend />
                  <Bar dataKey="monto" fill="#9d7f65" name="Monto en UYU" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Gráfica 2: Evolución de Ventas por Mes */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]">
                Evolución de Ventas por Mes
              </h2>
              <p className="text-sm text-neutral-600">
                Tendencia de ventas a lo largo del tiempo
              </p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.ventasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                    labelStyle={{ color: '#111111' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="monto"
                    stroke="#9d7f65"
                    strokeWidth={2}
                    name="Monto en UYU"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Gráfica 3: Tendencia Diaria */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]">
                Tendencia Diaria de Ventas
              </h2>
              <p className="text-sm text-neutral-600">
                Evolución día a día en el período seleccionado
              </p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dia"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    }}
                    labelStyle={{ color: '#111111' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="monto"
                    stroke="#9d7f65"
                    strokeWidth={2}
                    name="Monto en UYU"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Gráficas en grid de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 4: Ventas por Turno */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]">
                  Ventas por Turno
                </h2>
                <p className="text-sm text-neutral-600">
                  Comparación entre turno día y noche
                </p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.ventasPorTurno}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ turno, monto }: any) => `${turno}: ${formatCurrency(monto)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="monto"
                    >
                      {data.ventasPorTurno.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => value ? formatCurrency(value) : ''} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Gráfica 5: Ventas por Canal */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]">
                  Ventas por Canal
                </h2>
                <p className="text-sm text-neutral-600">
                  Distribución por canal de venta
                </p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ventasPorCanal} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="canal" type="category" width={100} />
                    <Tooltip
                      formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                      labelStyle={{ color: '#111111' }}
                    />
                    <Legend />
                    <Bar dataKey="monto" fill="#9d7f65" name="Monto en UYU" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          {/* Gráfica 6: Ventas por Restaurante */}
          {data.ventasPorRestaurante.length > 1 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]">
                  Ventas por Restaurante
                </h2>
                <p className="text-sm text-neutral-600">
                  Comparación entre restaurantes
                </p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ventasPorRestaurante}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number | undefined) => value ? formatCurrency(value) : ''}
                      labelStyle={{ color: '#111111' }}
                    />
                    <Legend />
                    <Bar dataKey="monto" fill="#9d7f65" name="Monto en UYU" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

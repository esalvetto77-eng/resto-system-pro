// Página de listado de Ventas y métricas (solo ADMIN/OWNER)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { formatCurrency } from '@/lib/utils'

interface Venta {
  id: string
  fecha: string
  monto: number
  tipoTurno: 'DAY' | 'NIGHT'
  restaurante: {
    id: string
    nombre: string
  }
}

interface VentasStats {
  ventasDay: { monto: number; cantidad: number }
  ventasNight: { monto: number; cantidad: number }
  totalDiario: { monto: number; cantidad: number }
  totalMensual: { monto: number; cantidad: number }
  totalMensualSinIva?: number
  porRestaurante: Array<{
    restaurante: { id: string; nombre: string }
    total: number
    cantidad: number
  }>
}

export default function VentasPage() {
  const router = useRouter()
  let isAdmin = false
  let authLoading = true
  let restaurantes: any[] = []

  let canEdit = () => false
  let canDelete = () => false

  try {
    const auth = useAuth()
    isAdmin = auth.isAdmin()
    authLoading = auth.loading || false
    canEdit = auth.canEdit || (() => false)
    canDelete = auth.canDelete || (() => false)
  } catch (error) {
    console.error('Error con useAuth:', error)
  }

  try {
    const restauranteContext = useRestaurante()
    restaurantes = restauranteContext.restaurantes || []
  } catch (error) {
    console.error('Error con useRestaurante:', error)
  }

  const [ventas, setVentas] = useState<Venta[]>([])
  const [stats, setStats] = useState<VentasStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [restauranteFiltro, setRestauranteFiltro] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirigir si no es ADMIN - mostrar página para crear venta
  useEffect(() => {
    if (mounted && !authLoading && !isAdmin) {
      router.replace('/ventas/nuevo')
    }
  }, [mounted, isAdmin, router, authLoading])

  useEffect(() => {
    // Solo cargar datos si es ADMIN y no está cargando la autenticación
    if (mounted && !authLoading && isAdmin) {
      fetchVentas()
      fetchStats()
    }
  }, [mounted, isAdmin, restauranteFiltro, authLoading])

  async function fetchVentas() {
    try {
      setLoading(true)
      const url = restauranteFiltro
        ? `/api/ventas?restauranteId=${restauranteFiltro}`
        : '/api/ventas'
      
      // Agregar opciones para evitar problemas de caché y red
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((fetchError) => {
        console.error('Error de red al cargar ventas:', fetchError)
        // Reintentar una vez después de un segundo
        return new Promise((resolve) => {
          setTimeout(() => {
            fetch(url, {
              cache: 'no-store',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            })
              .then(resolve)
              .catch(() => resolve(null))
          }, 1000)
        })
      })

      if (!response || !(response instanceof Response) || !response.ok) {
        if (response instanceof Response && response.status === 403) {
          router.push('/ventas/nuevo')
          setLoading(false)
          return
        }
        const errorData = response instanceof Response ? await response.json().catch(() => ({ error: 'Error desconocido' })) : { error: 'Error de conexión' }
        console.error('Error al cargar ventas:', response instanceof Response ? response.status : 'Sin respuesta', errorData)
        setVentas([])
        setLoading(false)
        return
      }
      const data = await response.json()
      console.log('Ventas recibidas:', data)
      setVentas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      setVentas([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const url = restauranteFiltro
        ? `/api/ventas/stats?restauranteId=${restauranteFiltro}`
        : '/api/ventas/stats'
      
      // Agregar opciones para evitar problemas de caché y red
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((fetchError) => {
        console.error('Error de red al cargar estadísticas:', fetchError)
        // Reintentar una vez después de un segundo
        return new Promise((resolve) => {
          setTimeout(() => {
            fetch(url, {
              cache: 'no-store',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            })
              .then(resolve)
              .catch(() => resolve(null))
          }, 1000)
        })
      })
      if (!response || !response.ok) {
        if (response?.status === 403) {
          console.warn('No autorizado para ver estadísticas')
          return
        }
        const errorData = response instanceof Response ? await response.json().catch(() => ({ error: 'Error desconocido' })) : { error: 'Error de conexión' }
        console.error('Error al cargar estadísticas:', response instanceof Response ? response.status : 'Sin respuesta', errorData)
        return
      }
      const data = await response.json()
      console.log('Estadísticas recibidas:', data)
      setStats(data)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  async function handleDelete(ventaId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setDeletingId(ventaId)
      const response = await fetch(`/api/ventas/${ventaId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar la venta')
      }

      // Recargar ventas y estadísticas
      await fetchVentas()
      await fetchStats()
    } catch (error: any) {
      console.error('Error al eliminar venta:', error)
      alert(error?.message || 'Error al eliminar la venta')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  // Si no está montado aún, mostrar carga
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  // Si está cargando la autenticación, mostrar carga
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando autenticación...</div>
      </div>
    )
  }

  // Si no es ADMIN, redirigir (o mostrar carga mientras redirige)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Redirigiendo...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Ventas
          </h1>
          <p className="text-neutral-600 mt-1">
            Seguimiento de ventas por turno
          </p>
        </div>
        <Link href="/ventas/nuevo">
          <Button>
            + Nueva Venta
          </Button>
        </Link>
      </div>

      {/* Filtro por restaurante */}
      <Card>
        <CardBody>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-neutral-700" style={{ fontWeight: 500 }}>
              Filtrar por restaurante:
            </label>
            <select
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              value={restauranteFiltro}
              onChange={(e) => setRestauranteFiltro(e.target.value)}
            >
              <option value="">Todos los restaurantes</option>
              {restaurantes.map((restaurante) => (
                <option key={restaurante.id} value={restaurante.id}>
                  {restaurante.nombre}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Loading indicator */}
      {loading && !stats && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-neutral-600">Cargando estadísticas...</div>
          </CardBody>
        </Card>
      )}

      {/* Métricas */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                Ventas Día (Hoy)
              </div>
              <div className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                {formatCurrency(stats.ventasDay.monto)}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.ventasDay.cantidad} {stats.ventasDay.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                Ventas Noche (Hoy)
              </div>
              <div className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                {formatCurrency(stats.ventasNight.monto)}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.ventasNight.cantidad} {stats.ventasNight.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                Total Diario
              </div>
              <div className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                {formatCurrency(stats.totalDiario.monto)}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.totalDiario.cantidad} {stats.totalDiario.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                Total Mensual
              </div>
              <div className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                {formatCurrency(stats.totalMensual.monto)}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.totalMensual.cantidad} {stats.totalMensual.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                Total Mensual sin IVA
              </div>
              <div className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                {formatCurrency(stats.totalMensualSinIva || 0)}
              </div>
              <div className="text-sm text-neutral-600">
                {stats.totalMensual.cantidad} {stats.totalMensual.cantidad === 1 ? 'venta' : 'ventas'}
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-neutral-600">No hay estadísticas disponibles aún</div>
          </CardBody>
        </Card>
      )}

      {/* Listado de ventas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Historial de Ventas
            </h2>
            <div className="text-sm text-neutral-600">
              {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-neutral-600">Cargando ventas...</div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 mb-4">No hay ventas registradas</p>
              <Link href="/ventas/nuevo">
                <Button>Crear primera venta</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Fecha</TableCell>
                  <TableCell header>Restaurante</TableCell>
                  <TableCell header>Turno</TableCell>
                  <TableCell header className="text-right">Monto</TableCell>
                  {(canEdit() || canDelete()) && (
                    <TableCell header className="text-right">Acciones</TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>
                      <div className="text-neutral-900" style={{ fontWeight: 500 }}>
                        {formatDate(venta.fecha)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {venta.restaurante.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={venta.tipoTurno === 'DAY' ? 'neutral' : 'neutral'}>
                        {venta.tipoTurno === 'DAY' ? 'Día' : 'Noche'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-[#111111]" style={{ fontWeight: 500 }}>
                        {formatCurrency(venta.monto)}
                      </div>
                    </TableCell>
                    {(canEdit() || canDelete()) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-3">
                          {canEdit() && (
                            <Link
                              href={`/ventas/${venta.id}/editar`}
                              className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
                            >
                              Editar
                            </Link>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDelete(venta.id)}
                              disabled={deletingId === venta.id}
                              className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                            >
                              {deletingId === venta.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateShort } from '@/lib/utils'

type PagoPendiente = {
  id: string
  proveedorId: string
  fecha: string
  monto: number
  descripcion: string | null
  pagado: boolean
  fechaPago: string | null
  observaciones: string | null
  createdAt: string
  updatedAt: string
  proveedor: {
    id: string
    nombre: string
  }
}

type Proveedor = {
  id: string
  nombre: string
  activo: boolean
}

export default function PagosPendientesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [pagos, setPagos] = useState<PagoPendiente[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroProveedor, setFiltroProveedor] = useState<string>('')
  const [soloPendientes, setSoloPendientes] = useState(true)

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/')
      return
    }
    loadData()
  }, [filtroProveedor, soloPendientes])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar proveedores
      const proveedoresRes = await fetch('/api/proveedores?activo=true', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (proveedoresRes.ok) {
        const proveedoresData = await proveedoresRes.json()
        setProveedores(Array.isArray(proveedoresData) ? proveedoresData : [])
      }

      // Cargar pagos pendientes
      const params = new URLSearchParams()
      if (filtroProveedor) params.append('proveedorId', filtroProveedor)
      if (soloPendientes) params.append('soloPendientes', 'true')

      const pagosRes = await fetch(`/api/pagos-pendientes?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!pagosRes.ok) {
        throw new Error('Error al cargar pagos pendientes')
      }

      const pagosData = await pagosRes.json()
      setPagos(Array.isArray(pagosData) ? pagosData : [])
    } catch (e: any) {
      setError(e?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarPagado = async (pagoId: string) => {
    if (!confirm('¿Marcar este pago como realizado?')) return

    try {
      const res = await fetch(`/api/pagos-pendientes/${pagoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pagado: true,
          fechaPago: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al marcar como pagado')
      }

      await loadData()
    } catch (e: any) {
      alert(e?.message || 'Error al marcar como pagado')
    }
  }

  const handleMarcarPendiente = async (pagoId: string) => {
    if (!confirm('¿Marcar este pago como pendiente nuevamente?')) return

    try {
      const res = await fetch(`/api/pagos-pendientes/${pagoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pagado: false,
          fechaPago: null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al marcar como pendiente')
      }

      await loadData()
    } catch (e: any) {
      alert(e?.message || 'Error al marcar como pendiente')
    }
  }

  const handleEliminar = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago pendiente? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch(`/api/pagos-pendientes/${pagoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al eliminar')
      }

      await loadData()
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar')
    }
  }

  const pagosPendientes = pagos.filter((p) => !p.pagado)
  const pagosRealizados = pagos.filter((p) => p.pagado)
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)
  const totalPagado = pagosRealizados.reduce((sum, p) => sum + p.monto, 0)

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Pagos Pendientes
            </h1>
            <p className="text-neutral-600 mt-1">
              Gestiona los pagos pendientes a proveedores
            </p>
          </div>
          <Link href="/pagos-pendientes/nuevo">
            <Button variant="primary">Nuevo Pago Pendiente</Button>
          </Link>
        </div>

        {error && (
          <Card className="border-paper-400 bg-paper-50">
            <CardBody className="p-4">
              <div className="text-sm text-paper-800">{error}</div>
            </CardBody>
          </Card>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="text-sm text-neutral-600">Total Pendiente</div>
              <div className="text-2xl font-semibold text-paper-800 mt-1">
                {formatCurrency(totalPendiente)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {pagosPendientes.length} {pagosPendientes.length === 1 ? 'pago' : 'pagos'}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="text-sm text-neutral-600">Total Pagado</div>
              <div className="text-2xl font-semibold text-terracotta-700 mt-1">
                {formatCurrency(totalPagado)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {pagosRealizados.length} {pagosRealizados.length === 1 ? 'pago' : 'pagos'}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="text-sm text-neutral-600">Total General</div>
              <div className="text-2xl font-semibold text-[#111111] mt-1">
                {formatCurrency(totalPendiente + totalPagado)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {pagos.length} {pagos.length === 1 ? 'pago' : 'pagos'} en total
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardBody className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">
                  Filtrar por Proveedor
                </label>
                <select
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloPendientes}
                    onChange={(e) => setSoloPendientes(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm text-neutral-600">
                    Solo mostrar pendientes
                  </span>
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabla de Pagos */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Lista de Pagos
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-6 text-center text-neutral-600">Cargando...</div>
            ) : pagos.length === 0 ? (
              <div className="p-6 text-center text-neutral-600">
                No hay pagos pendientes
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td>{formatDateShort(pago.fecha)}</td>
                      <td>{pago.proveedor.nombre}</td>
                      <td>{pago.descripcion || '-'}</td>
                      <td className="font-medium">{formatCurrency(pago.monto)}</td>
                      <td>
                        {pago.pagado ? (
                          <Badge variant="success">Pagado</Badge>
                        ) : (
                          <Badge variant="warning">Pendiente</Badge>
                        )}
                      </td>
                      <td>
                        {pago.fechaPago ? formatDateShort(pago.fechaPago) : '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link href={`/pagos-pendientes/${pago.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </Link>
                          {pago.pagado ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarcarPendiente(pago.id)}
                            >
                              Marcar Pendiente
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarcarPagado(pago.id)}
                            >
                              Marcar Pagado
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminar(pago.id)}
                            className="text-paper-700 hover:text-paper-900"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminOnly>
  )
}

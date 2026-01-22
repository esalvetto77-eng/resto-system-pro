'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

type Proveedor = {
  id: string
  nombre: string
  activo: boolean
}

type PagoPendiente = {
  id: string
  proveedorId: string
  fecha: string
  monto: number
  descripcion: string | null
  pagado: boolean
  fechaPago: string | null
  observaciones: string | null
  proveedor: {
    id: string
    nombre: string
  }
}

export default function EditarPagoPendientePage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const pagoId = params.id as string

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [pago, setPago] = useState<PagoPendiente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    proveedorId: '',
    fecha: '',
    monto: '',
    descripcion: '',
    observaciones: '',
    pagado: false,
    fechaPago: '',
  })

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/')
      return
    }
    loadData()
  }, [pagoId])

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

      // Cargar pago pendiente
      const pagoRes = await fetch(`/api/pagos-pendientes/${pagoId}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!pagoRes.ok) {
        throw new Error('Pago pendiente no encontrado')
      }

      const pagoData = await pagoRes.json()
      setPago(pagoData)

      // Formatear fecha para input date
      const fechaDate = new Date(pagoData.fecha)
      const fechaFormatted = fechaDate.toISOString().split('T')[0]
      const fechaPagoFormatted = pagoData.fechaPago
        ? new Date(pagoData.fechaPago).toISOString().split('T')[0]
        : ''

      setFormData({
        proveedorId: pagoData.proveedorId,
        fecha: fechaFormatted,
        monto: pagoData.monto.toString(),
        descripcion: pagoData.descripcion || '',
        observaciones: pagoData.observaciones || '',
        pagado: pagoData.pagado,
        fechaPago: fechaPagoFormatted,
      })
    } catch (e: any) {
      setError(e?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/pagos-pendientes/${pagoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proveedorId: formData.proveedorId,
          fecha: formData.fecha,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion || null,
          observaciones: formData.observaciones || null,
          pagado: formData.pagado,
          fechaPago: formData.pagado && formData.fechaPago ? formData.fechaPago : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al actualizar pago pendiente')
      }

      router.push('/pagos-pendientes')
    } catch (e: any) {
      setError(e?.message || 'Error al actualizar pago pendiente')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminOnly>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-neutral-600">Cargando...</div>
        </div>
      </AdminOnly>
    )
  }

  if (!pago) {
    return (
      <AdminOnly>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Pago Pendiente no encontrado
            </h1>
          </div>
          <Link href="/pagos-pendientes">
            <Button variant="ghost">Volver</Button>
          </Link>
        </div>
      </AdminOnly>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Editar Pago Pendiente
            </h1>
            <p className="text-neutral-600 mt-1">
              Modifica la información del pago pendiente
            </p>
          </div>
          <Link href="/pagos-pendientes">
            <Button variant="ghost">Volver</Button>
          </Link>
        </div>

        {error && (
          <Card className="border-paper-400 bg-paper-50">
            <CardBody className="p-4">
              <div className="text-sm text-paper-800">{error}</div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Información del Pago
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-neutral-600 mb-2">
                    Proveedor <span className="text-paper-600">*</span>
                  </label>
                  <select
                    value={formData.proveedorId}
                    onChange={(e) =>
                      setFormData({ ...formData, proveedorId: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-2">
                    Fecha <span className="text-paper-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-2">
                    Monto <span className="text-paper-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.monto}
                    onChange={(e) =>
                      setFormData({ ...formData, monto: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 mb-2">
                    Estado
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pagado}
                        onChange={(e) =>
                          setFormData({ ...formData, pagado: e.target.checked })
                        }
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm text-neutral-600">Marcar como pagado</span>
                    </label>
                  </div>
                </div>

                {formData.pagado && (
                  <div>
                    <label className="block text-sm text-neutral-600 mb-2">
                      Fecha de Pago
                    </label>
                    <input
                      type="date"
                      value={formData.fechaPago}
                      onChange={(e) =>
                        setFormData({ ...formData, fechaPago: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-neutral-600 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Link href="/pagos-pendientes">
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AdminOnly>
  )
}

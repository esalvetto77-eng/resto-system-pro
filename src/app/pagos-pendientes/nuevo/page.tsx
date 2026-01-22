'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NuevoPagoPendientePage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    proveedorId: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    descripcion: '',
    observaciones: '',
  })

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/')
      return
    }
    loadProveedores()
  }, [])

  const loadProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores?activo=true', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setProveedores(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Error al cargar proveedores:', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pagos-pendientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proveedorId: formData.proveedorId,
          fecha: formData.fecha,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion || null,
          observaciones: formData.observaciones || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Error al crear pago pendiente')
      }

      router.push('/pagos-pendientes')
    } catch (e: any) {
      setError(e?.message || 'Error al crear pago pendiente')
      setLoading(false)
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Nuevo Pago Pendiente
            </h1>
            <p className="text-neutral-600 mt-1">
              Registra un nuevo pago pendiente a un proveedor
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
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                  />
                </div>

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
                    placeholder="Ej: Pago de factura #12345"
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
                  placeholder="Notas adicionales sobre este pago..."
                  className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Link href="/pagos-pendientes">
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Pago Pendiente'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AdminOnly>
  )
}

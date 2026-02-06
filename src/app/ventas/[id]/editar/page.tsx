// Página para editar una venta existente
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Venta {
  id: string
  fecha: string
  monto: number
  tipoTurno: 'DAY' | 'NIGHT'
  canalVenta?: string | null
  restaurante: {
    id: string
    nombre: string
  }
}

export default function EditarVentaPage() {
  const router = useRouter()
  const params = useParams()
  const ventaId = params?.id as string
  const { restaurantes, loading: loadingRestaurantes } = useRestaurante()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    restauranteId: '',
    monto: '',
    tipoTurno: 'DAY' as 'DAY' | 'NIGHT',
    canalVenta: '' as '' | 'Local' | 'Mesas' | 'PedidosYa' | 'Poked' | 'Rainbowl',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (ventaId) {
      fetchVenta()
    }
  }, [ventaId])

  async function fetchVenta() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/ventas/${ventaId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Venta no encontrada')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al cargar la venta')
      }

      const venta: Venta = await response.json()
      
      // Formatear la fecha correctamente (solo la parte de fecha sin hora)
      const fecha = new Date(venta.fecha)
      const fechaStr = fecha.toISOString().split('T')[0]

      setFormData({
        restauranteId: venta.restaurante.id,
        monto: venta.monto.toString(),
        tipoTurno: venta.tipoTurno,
        canalVenta: (venta.canalVenta || '') as '' | 'Local' | 'Mesas' | 'PedidosYa' | 'Poked' | 'Rainbowl',
        fecha: fechaStr,
      })
    } catch (error: any) {
      console.error('Error:', error)
      setError(error?.message || 'Error al cargar la venta')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!formData.restauranteId) {
        alert('Debes seleccionar un restaurante')
        setSaving(false)
        return
      }

      const monto = parseFloat(formData.monto)
      if (isNaN(monto) || monto <= 0) {
        alert('El monto debe ser un número mayor a 0')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/ventas/${ventaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restauranteId: formData.restauranteId,
          monto,
          tipoTurno: formData.tipoTurno,
          canalVenta: formData.canalVenta || undefined,
          fecha: formData.fecha || undefined, // Enviar como string YYYY-MM-DD
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        const errorMessage = errorData.error || errorData.details || 'Error al actualizar la venta'
        console.error('Error del servidor:', errorData)
        throw new Error(errorMessage)
      }

      // Redirigir a la página de ventas después de guardar
      router.push('/ventas')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error?.message || 'Error al actualizar la venta')
      alert(error?.message || 'Error al actualizar la venta')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingRestaurantes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  if (error && !formData.restauranteId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Editar Venta
            </h1>
            <p className="text-neutral-600 mt-1">
              Error al cargar la venta
            </p>
          </div>
          <Link href="/ventas">
            <Button variant="ghost">Volver</Button>
          </Link>
        </div>

        <Card>
          <CardBody className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/ventas">
              <Button>Volver a Ventas</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Editar Venta
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar información de la venta
          </p>
        </div>
        <Link href="/ventas">
          <Button variant="ghost">Cancelar</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Información de la Venta
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" style={{ fontWeight: 500 }}>
                Restaurante *
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={formData.restauranteId}
                onChange={(e) =>
                  setFormData({ ...formData, restauranteId: e.target.value })
                }
              >
                <option value="">Seleccionar restaurante</option>
                {restaurantes.map((restaurante) => (
                  <option key={restaurante.id} value={restaurante.id}>
                    {restaurante.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" style={{ fontWeight: 500 }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={formData.fecha}
                onChange={(e) =>
                  setFormData({ ...formData, fecha: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" style={{ fontWeight: 500 }}>
                Tipo de Turno *
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={formData.tipoTurno}
                onChange={(e) =>
                  setFormData({ ...formData, tipoTurno: e.target.value as 'DAY' | 'NIGHT' })
                }
              >
                <option value="DAY">Día</option>
                <option value="NIGHT">Noche</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" style={{ fontWeight: 500 }}>
                Canal de Venta
              </label>
              <select
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                value={formData.canalVenta}
                onChange={(e) =>
                  setFormData({ ...formData, canalVenta: e.target.value as '' | 'Local' | 'Mesas' | 'PedidosYa' | 'Poked' | 'Rainbowl' })
                }
              >
                <option value="">Seleccionar canal (opcional)</option>
                <option value="Local">Local</option>
                <option value="Mesas">Mesas</option>
                <option value="PedidosYa">PedidosYa</option>
                <option value="Poked">Poked</option>
                <option value="Rainbowl">Rainbowl</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" style={{ fontWeight: 500 }}>
                Monto *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) =>
                  setFormData({ ...formData, monto: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
              <Link href="/ventas">
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

// Página para crear una nueva venta
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function NuevaVentaPage() {
  const router = useRouter()
  const { restaurantes, loading: loadingRestaurantes } = useRestaurante()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    restauranteId: '',
    monto: '',
    tipoTurno: 'DAY' as 'DAY' | 'NIGHT',
    fecha: new Date().toISOString().split('T')[0],
  })
  const [created, setCreated] = useState(false)

  useEffect(() => {
    // Pre-seleccionar el primer restaurante cuando carguen
    if (restaurantes.length > 0 && !formData.restauranteId) {
      setFormData({
        ...formData,
        restauranteId: restaurantes[0].id,
      })
    }
  }, [restaurantes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

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

      // Enviar la fecha como string YYYY-MM-DD para evitar problemas de zona horaria
      // El backend se encargará de convertirla correctamente
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restauranteId: formData.restauranteId,
          monto,
          tipoTurno: formData.tipoTurno,
          fecha: formData.fecha || undefined, // Enviar como string YYYY-MM-DD
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        const errorMessage = errorData.error || errorData.details || 'Error al crear venta'
        console.error('Error del servidor:', errorData)
        throw new Error(errorMessage)
      }

      // Mostrar confirmación
      setCreated(true)

      // Limpiar formulario y redirigir después de 2 segundos
      setTimeout(() => {
        setFormData({
          restauranteId: restaurantes.length > 0 ? restaurantes[0].id : '',
          monto: '',
          tipoTurno: 'DAY',
          fecha: new Date().toISOString().split('T')[0],
        })
        setCreated(false)
        router.push('/ventas/nuevo')
      }, 2000)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Error al crear la venta')
    } finally {
      setSaving(false)
    }
  }

  if (loadingRestaurantes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Nueva Venta
          </h1>
          <p className="text-neutral-600 mt-1">
            Registrar una nueva venta
          </p>
        </div>
        <Link href="/ventas">
          <Button variant="ghost">Cancelar</Button>
        </Link>
      </div>

      {created ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Venta registrada exitosamente
            </h3>
            <p className="text-neutral-600">
              La venta ha sido guardada correctamente
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Información de la Venta
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  {saving ? 'Guardando...' : 'Guardar Venta'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

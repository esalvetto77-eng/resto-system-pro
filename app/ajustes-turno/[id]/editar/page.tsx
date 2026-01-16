// Página para editar un Ajuste de Turno
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'

const TIPOS_AJUSTE = [
  { value: 'horas_extra', label: 'Horas Extra' },
  { value: 'falta', label: 'Falta' },
  { value: 'llegada_tarde', label: 'Llegada Tarde' },
  { value: 'salida_anticipada', label: 'Salida Anticipada' },
  { value: 'cambio_turno', label: 'Cambio de Turno' },
]

interface Empleado {
  id: string
  nombre: string
  apellido: string
}

export default function EditarAjusteTurnoPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [formData, setFormData] = useState({
    empleadoId: '',
    restauranteId: '',
    fecha: '',
    tipoAjuste: 'horas_extra',
    minutosAfectados: '',
    observacion: '',
  })

  useEffect(() => {
    fetchAjuste()
    fetchEmpleados()
  }, [params.id])

  async function fetchAjuste() {
    try {
      const response = await fetch(`/api/ajustes-turno/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar ajuste')
      const data = await response.json()
      
      setFormData({
        empleadoId: data.empleadoId || '',
        restauranteId: data.restauranteId || '',
        fecha: data.fecha ? new Date(data.fecha).toISOString().split('T')[0] : '',
        tipoAjuste: data.tipoAjuste || 'horas_extra',
        minutosAfectados: data.minutosAfectados?.toString() || '',
        observacion: data.observacion || '',
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el ajuste')
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmpleados() {
    try {
      const url = restauranteActivo
        ? `/api/empleados?restauranteId=${restauranteActivo.id}&activo=true`
        : '/api/empleados?activo=true'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar empleados')
      const data = await response.json()
      setEmpleados(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setEmpleados([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validar campos requeridos
      if (!formData.empleadoId || !formData.restauranteId || !formData.fecha || !formData.tipoAjuste) {
        alert('Por favor complete todos los campos requeridos')
        setSaving(false)
        return
      }

      // Validar minutosAfectados según el tipo
      if (formData.tipoAjuste !== 'falta' && formData.tipoAjuste !== 'cambio_turno') {
        if (!formData.minutosAfectados || formData.minutosAfectados === '') {
          alert('Por favor ingrese los minutos afectados')
          setSaving(false)
          return
        }
      }

      const payload: any = {
        empleadoId: formData.empleadoId,
        restauranteId: formData.restauranteId,
        fecha: formData.fecha,
        tipoAjuste: formData.tipoAjuste,
        observacion: formData.observacion || null,
      }

      // Agregar minutosAfectados solo si aplica
      if (formData.tipoAjuste !== 'falta' && formData.tipoAjuste !== 'cambio_turno') {
        payload.minutosAfectados = parseInt(formData.minutosAfectados)
      } else {
        payload.minutosAfectados = null
      }

      const response = await fetch(`/api/ajustes-turno/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar ajuste')
      }

      router.push('/ajustes-turno')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar ajuste')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando ajuste...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Editar Ajuste de Turno
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar un ajuste de turno existente
          </p>
        </div>
        <Link href="/ajustes-turno" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Empleado *</label>
                <select
                  required
                  className="input"
                  value={formData.empleadoId}
                  onChange={(e) =>
                    setFormData({ ...formData, empleadoId: e.target.value })
                  }
                  disabled
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  El empleado no se puede modificar
                </p>
              </div>

              <div>
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Tipo de Ajuste *</label>
                <select
                  required
                  className="input"
                  value={formData.tipoAjuste}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoAjuste: e.target.value, minutosAfectados: '' })
                  }
                >
                  {TIPOS_AJUSTE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.tipoAjuste !== 'falta' && formData.tipoAjuste !== 'cambio_turno' && (
                <div>
                  <label className="label">Minutos Afectados *</label>
                  <input
                    type="number"
                    required
                    className="input"
                    value={formData.minutosAfectados}
                    onChange={(e) =>
                      setFormData({ ...formData, minutosAfectados: e.target.value })
                    }
                    placeholder="Ej: 60 (para 1 hora)"
                    min="-1440"
                    max="1440"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Use valores positivos para retrasos/extras, negativos para anticipaciones
                  </p>
                </div>
              )}

              {formData.tipoAjuste === 'cambio_turno' && (
                <div>
                  <label className="label">Nota</label>
                  <p className="text-sm text-neutral-600">
                    Para cambio de turno, el horario personalizado se configurará en la edición del ajuste.
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="label">Observación</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.observacion}
                  onChange={(e) =>
                    setFormData({ ...formData, observacion: e.target.value })
                  }
                  placeholder="Detalles adicionales sobre el ajuste..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Link href="/ajustes-turno" className="btn btn-ghost">
                Cancelar
              </Link>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

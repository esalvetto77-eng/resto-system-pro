// Página para crear un nuevo Ajuste de Turno
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext.tsx'

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

export default function NuevoAjusteTurnoPage() {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const [loading, setLoading] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [formData, setFormData] = useState({
    empleadoId: '',
    restauranteId: restauranteActivo?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    tipoAjuste: 'horas_extra',
    minutosAfectados: '',
    observacion: '',
  })

  useEffect(() => {
    fetchEmpleados()
    if (restauranteActivo) {
      setFormData((prev) => ({ ...prev, restauranteId: restauranteActivo.id }))
    }
  }, [restauranteActivo])

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
    setLoading(true)

    try {
      // Validar campos requeridos
      if (!formData.empleadoId || !formData.restauranteId || !formData.fecha || !formData.tipoAjuste) {
        alert('Por favor complete todos los campos requeridos')
        setLoading(false)
        return
      }

      // Validar minutosAfectados según el tipo
      if (formData.tipoAjuste !== 'falta' && formData.tipoAjuste !== 'cambio_turno') {
        if (!formData.minutosAfectados || formData.minutosAfectados === '') {
          alert('Por favor ingrese los minutos afectados')
          setLoading(false)
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
      }

      const response = await fetch('/api/ajustes-turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear ajuste')
      }

      // Redirigir después de un breve delay para asegurar que se guardó
      setTimeout(() => {
        router.push('/ajustes-turno')
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear ajuste')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Nuevo Ajuste de Turno
          </h1>
          <p className="text-neutral-600 mt-1">
            Registrar un cambio puntual en el turno de un empleado
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
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido}
                    </option>
                  ))}
                </select>
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
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Guardando...' : 'Guardar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

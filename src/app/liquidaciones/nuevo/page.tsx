// Página para crear una nueva liquidación
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'

interface Empleado {
  id: string
  nombre: string
  apellido: string
  tipoSueldo: string
  sueldo: number | null
}

export default function NuevaLiquidacionPage() {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const [loading, setLoading] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [formData, setFormData] = useState({
    empleadoId: '',
    restauranteId: restauranteActivo?.id || '',
    fechaInicio: '',
    fechaFin: '',
    observaciones: '',
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
      if (!formData.empleadoId || !formData.restauranteId || !formData.fechaInicio || !formData.fechaFin) {
        alert('Por favor complete todos los campos requeridos')
        setLoading(false)
        return
      }

      // Validar que fechaInicio sea anterior a fechaFin
      const fechaInicio = new Date(formData.fechaInicio)
      const fechaFin = new Date(formData.fechaFin)
      if (fechaInicio > fechaFin) {
        alert('La fecha de inicio debe ser anterior a la fecha de fin')
        setLoading(false)
        return
      }

      const payload = {
        empleadoId: formData.empleadoId,
        restauranteId: formData.restauranteId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        observaciones: formData.observaciones || null,
      }

      const response = await fetch('/api/calculos-horas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear liquidación')
      }

      const result = await response.json()

      // Redirigir al detalle de la liquidación creada
      setTimeout(() => {
        router.push(`/liquidaciones/${result.id}`)
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear liquidación')
      setLoading(false)
    }
  }

  // Establecer fechas por defecto (primero y último día del mes actual)
  useEffect(() => {
    if (!formData.fechaInicio && !formData.fechaFin) {
      const hoy = new Date()
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      
      setFormData(prev => ({
        ...prev,
        fechaInicio: primerDia.toISOString().split('T')[0],
        fechaFin: ultimoDia.toISOString().split('T')[0],
      }))
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Nueva Liquidación
          </h1>
          <p className="text-neutral-600 mt-1">
            Calcular horas trabajadas y sueldo de un empleado
          </p>
        </div>
        <Link href="/liquidaciones" className="btn btn-ghost">
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
                      {empleado.nombre} {empleado.apellido} ({empleado.tipoSueldo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fecha Inicio *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.fechaInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaInicio: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Fecha Fin *</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.fechaFin}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaFin: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Observaciones</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  placeholder="Observaciones adicionales sobre la liquidación..."
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> El sistema calculará automáticamente las horas trabajadas, horas extra, 
                días trabajados, faltas y el sueldo correspondiente según el tipo de sueldo del empleado, 
                usando los horarios base, días de descanso y ajustes de turno registrados.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Link href="/liquidaciones" className="btn btn-ghost">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Calculando...' : 'Calcular Liquidación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

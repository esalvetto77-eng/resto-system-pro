// Página para generar una nueva Liquidación Profesional
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'

interface Empleado {
  id: string
  nombre: string
  apellido: string
  tipoRemuneracion: string | null
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function NuevaLiquidacionProfesionalPage() {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const [loading, setLoading] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const hoy = new Date()
  const [formData, setFormData] = useState({
    empleadoId: '',
    restauranteId: restauranteActivo?.id || '',
    mes: (hoy.getMonth() + 1).toString(),
    anio: hoy.getFullYear().toString(),
    irpfAdelantado: '',
    irpfMesesSinIRPF: '',
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
      if (!formData.empleadoId || !formData.restauranteId || !formData.mes || !formData.anio) {
        alert('Por favor complete todos los campos requeridos')
        setLoading(false)
        return
      }

      const payload = {
        empleadoId: formData.empleadoId,
        restauranteId: formData.restauranteId,
        mes: parseInt(formData.mes),
        anio: parseInt(formData.anio),
        irpfAdelantado: formData.irpfAdelantado ? parseFloat(formData.irpfAdelantado) : null,
        irpfMesesSinIRPF: formData.irpfMesesSinIRPF ? parseInt(formData.irpfMesesSinIRPF) : null,
        observaciones: formData.observaciones || null,
      }

      const response = await fetch('/api/liquidaciones-profesionales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al generar liquidación')
      }

      const result = await response.json()

      setTimeout(() => {
        router.push(`/liquidaciones-profesionales/${result.id}`)
        router.refresh()
      }, 500)
    } catch (err: any) {
      alert(err.message || 'Error al generar liquidación')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Generar Liquidación Profesional
          </h1>
          <p className="text-neutral-600 mt-1">
            Calcula la liquidación mensual completa con descuentos legales de Uruguay
          </p>
        </div>
        <Link href="/liquidaciones-profesionales" className="btn btn-ghost">
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
                  className="select select-bordered w-full"
                  value={formData.empleadoId}
                  onChange={(e) =>
                    setFormData({ ...formData, empleadoId: e.target.value })
                  }
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido}
                      {empleado.tipoRemuneracion && ` (${empleado.tipoRemuneracion})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mes *</label>
                <select
                  required
                  className="select select-bordered w-full"
                  value={formData.mes}
                  onChange={(e) =>
                    setFormData({ ...formData, mes: e.target.value })
                  }
                >
                  {MESES.map((mes, index) => (
                    <option key={index + 1} value={index + 1}>
                      {mes}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Año *</label>
                <input
                  type="number"
                  required
                  className="input input-bordered w-full"
                  value={formData.anio}
                  onChange={(e) =>
                    setFormData({ ...formData, anio: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">IRPF Adelantado (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  value={formData.irpfAdelantado}
                  onChange={(e) =>
                    setFormData({ ...formData, irpfAdelantado: e.target.value })
                  }
                  placeholder="Monto de IRPF adelantado"
                />
              </div>

              <div>
                <label className="label">Meses sin IRPF (opcional)</label>
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-full"
                  value={formData.irpfMesesSinIRPF}
                  onChange={(e) =>
                    setFormData({ ...formData, irpfMesesSinIRPF: e.target.value })
                  }
                  placeholder="Cantidad de meses sin IRPF"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Observaciones</label>
                <textarea
                  className="textarea textarea-bordered w-full"
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
                <strong>Nota:</strong> El sistema calculará automáticamente:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Haberes: sueldo base, horas extra, ticket alimentación</li>
                  <li>Descuentos legales: BPS (15%), FRL (0.1%), Seguro (3%), SNIS (1.5%), IRPF</li>
                  <li>Descuentos generales: adelantos y descuentos manuales</li>
                  <li>Líquido a cobrar</li>
                </ul>
                Los cálculos se basan en los eventos mensuales registrados para el período seleccionado.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Link href="/liquidaciones-profesionales" className="btn btn-ghost">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Generando...' : 'Generar Liquidación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

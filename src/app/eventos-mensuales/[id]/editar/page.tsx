// Página para editar un Evento Mensual
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'

const TIPOS_EVENTO = [
  { value: 'HORAS_EXTRA', label: 'Horas Extra' },
  { value: 'FALTA', label: 'Falta' },
  { value: 'ADELANTO_EFECTIVO', label: 'Adelanto Efectivo' },
  { value: 'ADELANTO_CONSUMICIONES', label: 'Adelanto Consumiciones' },
  { value: 'DESCUENTO_MANUAL', label: 'Descuento Manual' },
]

interface Empleado {
  id: string
  nombre: string
  apellido: string
}

export default function EditarEventoMensualPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const [loading, setLoading] = useState(true)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [formData, setFormData] = useState({
    empleadoId: '',
    restauranteId: '',
    mes: '',
    anio: '',
    fecha: '',
    tipoEvento: 'HORAS_EXTRA',
    cantidad: '',
    valorUnitario: '',
    monto: '',
    observacion: '',
  })

  useEffect(() => {
    fetchEvento()
    fetchEmpleados()
  }, [params.id])

  async function fetchEvento() {
    try {
      const response = await fetch(`/api/eventos-mensuales/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar evento')
      const data = await response.json()
      setFormData({
        empleadoId: data.empleadoId,
        restauranteId: data.restauranteId,
        mes: data.mes.toString(),
        anio: data.anio.toString(),
        fecha: new Date(data.fecha).toISOString().split('T')[0],
        tipoEvento: data.tipoEvento,
        cantidad: data.cantidad?.toString() || '',
        valorUnitario: data.valorUnitario?.toString() || '',
        monto: data.monto.toString(),
        observacion: data.observacion || '',
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar evento')
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      // Calcular monto automáticamente para horas extra
      if (name === 'cantidad' || name === 'valorUnitario') {
        if (newData.tipoEvento === 'HORAS_EXTRA' && newData.cantidad && newData.valorUnitario) {
          newData.monto = (parseFloat(newData.cantidad) * parseFloat(newData.valorUnitario)).toString()
        }
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.mes || !formData.anio || !formData.fecha || !formData.tipoEvento) {
        alert('Por favor complete todos los campos requeridos')
        setLoading(false)
        return
      }

      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        alert('El monto debe ser mayor a cero')
        setLoading(false)
        return
      }

      const payload = {
        mes: formData.mes,
        anio: formData.anio,
        fecha: formData.fecha,
        tipoEvento: formData.tipoEvento,
        cantidad: formData.cantidad ? parseFloat(formData.cantidad) : null,
        valorUnitario: formData.valorUnitario ? parseFloat(formData.valorUnitario) : null,
        monto: parseFloat(formData.monto),
        observacion: formData.observacion || null,
      }

      const response = await fetch(`/api/eventos-mensuales/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar evento')
      }

      setTimeout(() => {
        router.push('/eventos-mensuales')
        router.refresh()
      }, 500)
    } catch (err: any) {
      alert(err.message || 'Error al actualizar evento')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando evento...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Editar Evento Mensual</h1>
          <p className="text-neutral-600 mt-1">
            Modifica un evento mensual
          </p>
        </div>
        <Link href="/eventos-mensuales" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Empleado</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={empleados.find(e => e.id === formData.empleadoId) 
                    ? `${empleados.find(e => e.id === formData.empleadoId)?.nombre} ${empleados.find(e => e.id === formData.empleadoId)?.apellido}`
                    : 'Cargando...'}
                  disabled
                />
              </div>

              <div>
                <label className="label">Tipo de Evento *</label>
                <select
                  required
                  className="select select-bordered w-full"
                  name="tipoEvento"
                  value={formData.tipoEvento}
                  onChange={handleChange}
                >
                  {TIPOS_EVENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  required
                  className="input input-bordered w-full"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Mes *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="12"
                  className="input input-bordered w-full"
                  name="mes"
                  value={formData.mes}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Año *</label>
                <input
                  type="number"
                  required
                  className="input input-bordered w-full"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                />
              </div>

              {formData.tipoEvento === 'HORAS_EXTRA' && (
                <>
                  <div>
                    <label className="label">Cantidad de Horas</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="input input-bordered w-full"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="label">Valor por Hora</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input input-bordered w-full"
                      name="valorUnitario"
                      value={formData.valorUnitario}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              {formData.tipoEvento === 'FALTA' && (
                <div>
                  <label className="label">Cantidad de Días</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="input input-bordered w-full"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="label">Monto *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  placeholder="Monto del evento"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Observación</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  name="observacion"
                  value={formData.observacion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <Link href="/eventos-mensuales" className="btn btn-ghost">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

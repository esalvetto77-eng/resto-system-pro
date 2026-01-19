// Página de listado de Eventos Mensuales
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { AdminOnly } from '@/components/guards/AdminOnly'

interface EventoMensual {
  id: string
  mes: number
  anio: number
  fecha: string
  tipoEvento: string
  cantidad: number | null
  valorUnitario: number | null
  monto: number
  observacion: string | null
  empleado: {
    id: string
    nombre: string
    apellido: string
  }
  restaurante: {
    id: string
    nombre: string
  }
}

const TIPOS_EVENTO: Record<string, string> = {
  HORAS_EXTRA: 'Horas Extra',
  FALTA: 'Falta',
  ADELANTO_EFECTIVO: 'Adelanto Efectivo',
  ADELANTO_CONSUMICIONES: 'Adelanto Consumiciones',
  DESCUENTO_MANUAL: 'Descuento Manual',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function EventosMensualesPage() {
  const { restauranteActivo } = useRestaurante()
  const [eventos, setEventos] = useState<EventoMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState<string>('')
  const [filtroAnio, setFiltroAnio] = useState<string>(new Date().getFullYear().toString())
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  useEffect(() => {
    fetchEventos()
  }, [restauranteActivo?.id, filtroMes, filtroAnio, filtroTipo])

  async function fetchEventos() {
    try {
      setLoading(true)
      let url = '/api/eventos-mensuales?'
      if (restauranteActivo) {
        url += `restauranteId=${restauranteActivo.id}&`
      }
      if (filtroMes) {
        url += `mes=${filtroMes}&`
      }
      if (filtroAnio) {
        url += `anio=${filtroAnio}&`
      }
      if (filtroTipo) {
        url += `tipoEvento=${filtroTipo}&`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar eventos')
      const data = await response.json()
      setEventos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setEventos([])
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return

    try {
      const response = await fetch(`/api/eventos-mensuales/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar evento')
      fetchEventos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar evento.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando eventos...</div>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Eventos Mensuales</h1>
          <p className="text-neutral-600 mt-1">
            Gestión de horas extra, faltas, adelantos y descuentos del mes
          </p>
        </div>
        <Link href="/eventos-mensuales/nuevo" className="btn btn-primary">
          + Nuevo Evento
        </Link>
      </div>

      {restauranteActivo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Mostrando eventos del restaurante activo: <strong>{restauranteActivo.nombre}</strong>
          </p>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filtroMes" className="label">Mes</label>
            <select
              id="filtroMes"
              className="select select-bordered w-full"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              <option value="">Todos los meses</option>
              {MESES.map((mes, index) => (
                <option key={index + 1} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtroAnio" className="label">Año</label>
            <input
              type="number"
              id="filtroAnio"
              className="input input-bordered w-full"
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
              placeholder="Año"
            />
          </div>
          <div>
            <label htmlFor="filtroTipo" className="label">Tipo de Evento</label>
            <select
              id="filtroTipo"
              className="select select-bordered w-full"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS_EVENTO).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {eventos.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">No hay eventos mensuales registrados</p>
            <Link href="/eventos-mensuales/nuevo" className="btn btn-primary">
              Crear Primer Evento
            </Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="card-body p-0">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Monto
                  </th>
                  {!restauranteActivo && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Restaurante
                    </th>
                  )}
                  <th className="relative px-4 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {eventos.map((evento) => (
                  <tr key={evento.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ fontWeight: 500, color: '#111111', lineHeight: 1.6 }}>
                      {evento.empleado.nombre} {evento.empleado.apellido}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                      {formatDateShort(evento.fecha)} ({MESES[evento.mes - 1]} {evento.anio})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                      {TIPOS_EVENTO[evento.tipoEvento] || evento.tipoEvento}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                      {evento.cantidad !== null ? (
                        <span>
                          {evento.cantidad}
                          {evento.tipoEvento === 'HORAS_EXTRA' && ' hrs'}
                          {evento.tipoEvento === 'FALTA' && ' días'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold" style={{ fontWeight: 600, color: '#111111', lineHeight: 1.5 }}>
                      {formatCurrency(evento.monto)}
                    </td>
                    {!restauranteActivo && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                        {evento.restaurante.nombre}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/eventos-mensuales/${evento.id}/editar`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleEliminar(evento.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </AdminOnly>
  )
}

// Página de listado de Ajustes de Turno
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext.tsx'
import { formatDateShort } from '@/lib/utils.ts'
// Ajustes de turno: Todos pueden crear/editar (no se requieren restricciones)

interface AjusteTurno {
  id: string
  fecha: string
  tipoAjuste: string
  minutosAfectados: number | null
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

const TIPOS_AJUSTE: Record<string, string> = {
  horas_extra: 'Horas Extra',
  falta: 'Falta',
  llegada_tarde: 'Llegada Tarde',
  salida_anticipada: 'Salida Anticipada',
  cambio_turno: 'Cambio de Turno',
}

export default function AjustesTurnoPage() {
  const { restauranteActivo } = useRestaurante()
  const [ajustes, setAjustes] = useState<AjusteTurno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAjustes()
  }, [restauranteActivo?.id])

  async function fetchAjustes() {
    try {
      setLoading(true)
      const url = restauranteActivo
        ? `/api/ajustes-turno?restauranteId=${restauranteActivo.id}`
        : '/api/ajustes-turno'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar ajustes')
      const data = await response.json()
      setAjustes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setAjustes([])
    } finally {
      setLoading(false)
    }
  }

  function formatearMinutos(minutos: number | null, tipo: string): string {
    if (minutos === null) return '-'
    if (tipo === 'falta') return '-'
    const horas = Math.floor(Math.abs(minutos) / 60)
    const mins = Math.abs(minutos) % 60
    const signo = minutos >= 0 ? '+' : '-'
    if (horas > 0) {
      return `${signo}${horas}h ${mins}m`
    }
    return `${signo}${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando ajustes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Ajustes de Turno
          </h1>
          <p className="text-neutral-600 mt-1">
            {restauranteActivo
              ? `Restaurante: ${restauranteActivo.nombre}`
              : 'Todos los restaurantes'}
          </p>
        </div>
        <Link href="/ajustes-turno/nuevo" className="btn btn-primary">
          + Nuevo Ajuste
        </Link>
      </div>

      {restauranteActivo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Mostrando ajustes del restaurante activo: <strong>{restauranteActivo.nombre}</strong>
          </p>
        </div>
      )}

      {ajustes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              No hay ajustes de turno registrados
            </p>
            <Link href="/ajustes-turno/nuevo" className="btn btn-primary">
              Crear Primer Ajuste
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Ajuste
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Observación
                    </th>
                    {!restauranteActivo && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Restaurante
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {ajustes.map((ajuste) => (
                    <tr key={ajuste.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDateShort(ajuste.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/empleados/${ajuste.empleado.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          {ajuste.empleado.nombre} {ajuste.empleado.apellido}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-neutral">
                          {TIPOS_AJUSTE[ajuste.tipoAjuste] || ajuste.tipoAjuste}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatearMinutos(ajuste.minutosAfectados, ajuste.tipoAjuste)}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                        {ajuste.observacion || '-'}
                      </td>
                      {!restauranteActivo && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {ajuste.restaurante.nombre}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/ajustes-turno/${ajuste.id}/editar`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

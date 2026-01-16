// Página de listado de Liquidaciones (Cálculos de Horas)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface CalculoHoras {
  id: string
  fechaInicio: string
  fechaFin: string
  horasBase: number
  horasExtra: number
  horasTrabajadas: number
  horasDescontadas: number
  diasTrabajados: number
  diasCompletos: number
  diasMedios: number
  faltas: number
  montoBase: number
  montoHorasExtra: number
  montoDescuentos: number
  totalPagar: number
  observaciones: string | null
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

export default function LiquidacionesPage() {
  const { restauranteActivo } = useRestaurante()
  const [calculos, setCalculos] = useState<CalculoHoras[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalculos()
  }, [restauranteActivo?.id])

  async function fetchCalculos() {
    try {
      setLoading(true)
      const url = restauranteActivo
        ? `/api/calculos-horas?restauranteId=${restauranteActivo.id}`
        : '/api/calculos-horas'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar liquidaciones')
      const data = await response.json()
      setCalculos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setCalculos([])
    } finally {
      setLoading(false)
    }
  }

  function formatearHoras(horas: number): string {
    const horasEnteras = Math.floor(horas)
    const minutos = Math.round((horas - horasEnteras) * 60)
    if (minutos === 0) {
      return `${horasEnteras}h`
    }
    return `${horasEnteras}h ${minutos}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando liquidaciones...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Liquidaciones de Sueldos
          </h1>
          <p className="text-neutral-600 mt-1">
            {restauranteActivo
              ? `Restaurante: ${restauranteActivo.nombre}`
              : 'Todos los restaurantes'}
          </p>
        </div>
        <Link href="/liquidaciones/nuevo" className="btn btn-primary">
          + Nueva Liquidación
        </Link>
      </div>

      {restauranteActivo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Mostrando liquidaciones del restaurante activo: <strong>{restauranteActivo.nombre}</strong>
          </p>
        </div>
      )}

      {calculos.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              No hay liquidaciones registradas
            </p>
            <Link href="/liquidaciones/nuevo" className="btn btn-primary">
              Crear Primera Liquidación
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
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Días
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Total a Pagar
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
                  {calculos.map((calculo) => (
                    <tr key={calculo.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/empleados/${calculo.empleado.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          {calculo.empleado.nombre} {calculo.empleado.apellido}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDateShort(calculo.fechaInicio)} - {formatDateShort(calculo.fechaFin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        <div className="space-y-1">
                          <div>Total: {formatearHoras(calculo.horasTrabajadas)}</div>
                          {calculo.horasExtra > 0 && (
                            <div className="text-green-600">Extra: {formatearHoras(calculo.horasExtra)}</div>
                          )}
                          {calculo.horasDescontadas > 0 && (
                            <div className="text-red-600">Desc: {formatearHoras(calculo.horasDescontadas)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        <div className="space-y-1">
                          <div>Trabajados: {calculo.diasTrabajados}</div>
                          <div className="text-xs text-neutral-500">
                            {calculo.diasCompletos} completos, {calculo.diasMedios} medios
                          </div>
                          {calculo.faltas > 0 && (
                            <div className="text-red-600">Faltas: {calculo.faltas}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-neutral-900">
                        {formatCurrency(calculo.totalPagar)}
                      </td>
                      {!restauranteActivo && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {calculo.restaurante.nombre}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/liquidaciones/${calculo.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Ver Detalle
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

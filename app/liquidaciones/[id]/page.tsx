// Página de detalle de Liquidación
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDateShort } from '@/lib/utils.ts'

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

export default function LiquidacionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [calculo, setCalculo] = useState<CalculoHoras | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalculo()
  }, [params.id])

  async function fetchCalculo() {
    try {
      const response = await fetch(`/api/calculos-horas/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar liquidación')
      const data = await response.json()
      setCalculo(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la liquidación')
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
        <div className="text-neutral-600">Cargando liquidación...</div>
      </div>
    )
  }

  if (!calculo) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-neutral-600 mb-4">Liquidación no encontrada</p>
          <Link href="/liquidaciones" className="btn btn-primary">
            Volver a Liquidaciones
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Liquidación de Sueldo
          </h1>
          <p className="text-neutral-600 mt-1">
            {calculo.empleado.nombre} {calculo.empleado.apellido}
          </p>
        </div>
        <Link href="/liquidaciones" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      {/* Información General */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-neutral-900">
            Información General
          </h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-neutral-500">Empleado</div>
              <div className="text-base text-neutral-900">
                <Link
                  href={`/empleados/${calculo.empleado.id}`}
                  className="text-primary-600 hover:text-primary-800"
                >
                  {calculo.empleado.nombre} {calculo.empleado.apellido}
                </Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Restaurante</div>
              <div className="text-base text-neutral-900">{calculo.restaurante.nombre}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Período</div>
              <div className="text-base text-neutral-900">
                {formatDateShort(calculo.fechaInicio)} - {formatDateShort(calculo.fechaFin)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horas Trabajadas */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-neutral-900">
            Horas Trabajadas
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-neutral-500">Horas Base</div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatearHoras(calculo.horasBase)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Horas Extra</div>
              <div className="text-2xl font-bold text-green-600">
                {formatearHoras(calculo.horasExtra)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Horas Descontadas</div>
              <div className="text-2xl font-bold text-red-600">
                {formatearHoras(calculo.horasDescontadas)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Total Horas</div>
              <div className="text-2xl font-bold text-primary-600">
                {formatearHoras(calculo.horasTrabajadas)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Días Trabajados */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-neutral-900">
            Días Trabajados
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-neutral-500">Días Trabajados</div>
              <div className="text-2xl font-bold text-neutral-900">
                {calculo.diasTrabajados}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Días Completos</div>
              <div className="text-2xl font-bold text-neutral-700">
                {calculo.diasCompletos}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Medios Días</div>
              <div className="text-2xl font-bold text-neutral-700">
                {calculo.diasMedios}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-500">Faltas</div>
              <div className="text-2xl font-bold text-red-600">
                {calculo.faltas}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cálculo de Sueldo */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-neutral-900">
            Cálculo de Sueldo
          </h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-neutral-200">
              <div className="text-base font-medium text-neutral-700">Sueldo Base</div>
              <div className="text-lg font-semibold text-neutral-900">
                {formatCurrency(calculo.montoBase)}
              </div>
            </div>
            {calculo.montoHorasExtra > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                <div className="text-base font-medium text-green-700">Horas Extra</div>
                <div className="text-lg font-semibold text-green-600">
                  +{formatCurrency(calculo.montoHorasExtra)}
                </div>
              </div>
            )}
            {calculo.montoDescuentos > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                <div className="text-base font-medium text-red-700">Descuentos</div>
                <div className="text-lg font-semibold text-red-600">
                  -{formatCurrency(calculo.montoDescuentos)}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t-2 border-neutral-300 mt-2">
              <div className="text-lg font-bold text-neutral-900">Total a Pagar</div>
              <div className="text-2xl font-bold text-primary-600">
                {formatCurrency(calculo.totalPagar)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {calculo.observaciones && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-neutral-900">
              Observaciones
            </h2>
          </div>
          <div className="card-body">
            <p className="text-neutral-700 whitespace-pre-wrap">
              {calculo.observaciones}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Página de listado de Liquidaciones Profesionales
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { AdminOnly } from '@/components/guards/AdminOnly'

interface LiquidacionProfesional {
  id: string
  mes: number
  anio: number
  fechaCierre: string
  totalHaberes: number
  totalDescuentos: number
  liquidoACobrar: number
  empleado: {
    id: string
    nombre: string
    apellido: string
    dni: string | null
    cargo: string | null
  }
  restaurante: {
    id: string
    nombre: string
  }
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function LiquidacionesProfesionalesPage() {
  const { restauranteActivo } = useRestaurante()
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionProfesional[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState<string>('')
  const [filtroAnio, setFiltroAnio] = useState<string>(new Date().getFullYear().toString())

  useEffect(() => {
    fetchLiquidaciones()
  }, [restauranteActivo?.id, filtroMes, filtroAnio])

  async function fetchLiquidaciones() {
    try {
      setLoading(true)
      let url = '/api/liquidaciones-profesionales?'
      if (restauranteActivo) {
        url += `restauranteId=${restauranteActivo.id}&`
      }
      if (filtroMes) {
        url += `mes=${filtroMes}&`
      }
      if (filtroAnio) {
        url += `anio=${filtroAnio}&`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar liquidaciones')
      const data = await response.json()
      setLiquidaciones(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
      setLiquidaciones([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando liquidaciones...</div>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Liquidaciones Profesionales
          </h1>
          <p className="text-neutral-600 mt-1">
            Sistema de liquidación salarial - Uruguay
          </p>
        </div>
        <Link href="/liquidaciones-profesionales/nuevo" className="btn btn-primary">
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

      <div className="card p-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {liquidaciones.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              No hay liquidaciones registradas
            </p>
            <Link href="/liquidaciones-profesionales/nuevo" className="btn btn-primary">
              Generar Primera Liquidación
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Haberes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Descuentos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Líquido a Cobrar
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
                  {liquidaciones.map((liquidacion) => (
                    <tr key={liquidacion.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {liquidacion.empleado.nombre} {liquidacion.empleado.apellido}
                        </div>
                        {liquidacion.empleado.cargo && (
                          <div className="text-sm text-neutral-500">{liquidacion.empleado.cargo}</div>
                        )}
                        {liquidacion.empleado.dni && (
                          <div className="text-xs text-neutral-400">CI: {liquidacion.empleado.dni}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {MESES[liquidacion.mes - 1]} {liquidacion.anio}
                        <div className="text-xs text-neutral-500">
                          {formatDateShort(liquidacion.fechaCierre)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {formatCurrency(liquidacion.totalHaberes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                        {formatCurrency(liquidacion.totalDescuentos)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-primary-600">
                        {formatCurrency(liquidacion.liquidoACobrar)}
                      </td>
                      {!restauranteActivo && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {liquidacion.restaurante.nombre}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/liquidaciones-profesionales/${liquidacion.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Ver Recibo
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
    </AdminOnly>
  )
}

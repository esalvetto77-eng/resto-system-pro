// Página de detalle de Liquidación Profesional - Recibo de Sueldo Uruguay
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface LiquidacionProfesional {
  id: string
  mes: number
  anio: number
  fechaCierre: string
  nominalCalculado: number
  sueldoBasico: number
  jornalesDescontados: number
  horasExtras: number
  montoHorasExtras: number
  ticketAlimentacion: number
  diasTicket: number
  totalHaberes: number
  totalGravado: number
  aporteJubilatorio: number
  frl: number
  seguroEnfermedad: number
  snis: number
  irpfBaseImponible: number
  irpfAdelantado: number | null
  irpfMesesSinIRPF: number | null
  irpfMonto: number
  totalDescuentosLegales: number
  adelantosEfectivo: number
  adelantosConsumiciones: number
  descuentosManuales: number
  totalDescuentosGenerales: number
  totalDescuentos: number
  liquidoACobrar: number
  liquidoPactado: number
  diferenciaLiquido: number
  redondeo: number | null
  observaciones: string | null
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

export default function LiquidacionProfesionalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [liquidacion, setLiquidacion] = useState<LiquidacionProfesional | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiquidacion()
  }, [params.id])

  async function fetchLiquidacion() {
    try {
      const response = await fetch(`/api/liquidaciones-profesionales/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar liquidación')
      const data = await response.json()
      setLiquidacion(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar la liquidación')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando liquidación...</div>
      </div>
    )
  }

  if (!liquidacion) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-neutral-600 mb-4">Liquidación no encontrada</p>
          <Link href="/liquidaciones-profesionales" className="btn btn-primary">
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
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Recibo de Sueldo
          </h1>
          <p className="text-neutral-600 mt-1">
            {MESES[liquidacion.mes - 1]} {liquidacion.anio}
          </p>
        </div>
        <Link href="/liquidaciones-profesionales" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      {/* Recibo de Sueldo - Estilo Uruguay */}
      <div className="card border-2 border-neutral-300">
        <div className="card-body p-8">
          {/* Encabezado */}
          <div className="border-b-2 border-neutral-300 pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  {liquidacion.restaurante.nombre}
                </h2>
                <p className="text-neutral-600">Liquidación de Sueldos</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">
                  Fecha de Cierre: {formatDateShort(liquidacion.fechaCierre)}
                </p>
                <p className="text-sm text-neutral-600">
                  Período: {MESES[liquidacion.mes - 1]} {liquidacion.anio}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-neutral-500">Empleado</p>
                <p className="text-base font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                  {liquidacion.empleado.nombre} {liquidacion.empleado.apellido}
                </p>
                {liquidacion.empleado.cargo && (
                  <p className="text-sm text-neutral-600">{liquidacion.empleado.cargo}</p>
                )}
                {liquidacion.empleado.dni && (
                  <p className="text-sm text-neutral-600">CI: {liquidacion.empleado.dni}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Restaurante</p>
                <p className="text-base font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                  {liquidacion.restaurante.nombre}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* HABERES */}
            <div>
              <h3 className="text-xl font-semibold text-[#111111] mb-4 pb-2 border-b border-neutral-300" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                HABERES
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700">Sueldo Básico</span>
                  <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                    {formatCurrency(liquidacion.sueldoBasico)}
                  </span>
                </div>
                {liquidacion.jornalesDescontados > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Jornales Descontados</span>
                    <span className="font-semibold">
                      -{formatCurrency(liquidacion.jornalesDescontados)}
                    </span>
                  </div>
                )}
                {liquidacion.montoHorasExtras > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-700">
                      Horas Extra ({liquidacion.horasExtras.toFixed(2)} hrs)
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(liquidacion.montoHorasExtras)}
                    </span>
                  </div>
                )}
                {liquidacion.ticketAlimentacion > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-700">
                      Ticket Alimentación ({liquidacion.diasTicket} días)
                    </span>
                    <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                      {formatCurrency(liquidacion.ticketAlimentacion)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-400 text-lg" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                  <span>TOTAL HABERES</span>
                  <span className="text-green-600">
                    {formatCurrency(liquidacion.totalHaberes)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">Total Gravado</span>
                  <span className="text-neutral-600">
                    {formatCurrency(liquidacion.totalGravado)}
                  </span>
                </div>
              </div>
            </div>

            {/* DESCUENTOS */}
            <div>
              <h3 className="text-xl font-semibold text-[#111111] mb-4 pb-2 border-b border-neutral-300" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                DESCUENTOS
              </h3>
              <div className="space-y-3">
                {/* Descuentos Legales */}
                <div>
                  <p className="text-sm font-medium text-neutral-500 mb-2">Descuentos Legales</p>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Aporte Jubilatorio (15%)</span>
                      <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                        {formatCurrency(liquidacion.aporteJubilatorio)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">FRL (0.1%)</span>
                      <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                        {formatCurrency(liquidacion.frl)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Seguro por Enfermedad (3%)</span>
                      <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                        {formatCurrency(liquidacion.seguroEnfermedad)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">SNIS (1.5%)</span>
                      <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                        {formatCurrency(liquidacion.snis)}
                      </span>
                    </div>
                    {liquidacion.irpfMonto > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-600">IRPF</span>
                        <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                          {formatCurrency(liquidacion.irpfMonto)}
                        </span>
                      </div>
                    )}
                    {liquidacion.irpfAdelantado && liquidacion.irpfAdelantado > 0 && (
                      <div className="flex justify-between items-center text-xs text-blue-600">
                        <span>IRPF Adelantado</span>
                        <span>-{formatCurrency(liquidacion.irpfAdelantado)}</span>
                      </div>
                    )}
                    {liquidacion.irpfMesesSinIRPF && liquidacion.irpfMesesSinIRPF > 0 && (
                      <div className="flex justify-between items-center text-xs text-blue-600">
                        <span>Meses sin IRPF</span>
                        <span>{liquidacion.irpfMesesSinIRPF}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-200 font-semibold">
                      <span>Total Descuentos Legales</span>
                      <span className="text-red-600">
                        {formatCurrency(liquidacion.totalDescuentosLegales)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Descuentos Generales */}
                {(liquidacion.adelantosEfectivo > 0 || liquidacion.adelantosConsumiciones > 0 || liquidacion.descuentosManuales > 0) && (
                  <div className="pt-3">
                    <p className="text-sm font-medium text-neutral-500 mb-2">Descuentos Generales</p>
                    <div className="space-y-2 pl-4">
                      {liquidacion.adelantosEfectivo > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600">Adelantos Efectivo</span>
                          <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                            {formatCurrency(liquidacion.adelantosEfectivo)}
                          </span>
                        </div>
                      )}
                      {liquidacion.adelantosConsumiciones > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600">Adelantos Consumiciones</span>
                          <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                            {formatCurrency(liquidacion.adelantosConsumiciones)}
                          </span>
                        </div>
                      )}
                      {liquidacion.descuentosManuales > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600">Descuentos Manuales</span>
                          <span className="font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                            {formatCurrency(liquidacion.descuentosManuales)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200 font-semibold">
                        <span>Total Descuentos Generales</span>
                        <span className="text-red-600">
                          {formatCurrency(liquidacion.totalDescuentosGenerales)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t-2 border-neutral-400 text-lg" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                  <span>TOTAL DESCUENTOS</span>
                  <span className="text-red-600">
                    {formatCurrency(liquidacion.totalDescuentos)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LÍQUIDO A COBRAR */}
          <div className="mt-8 pt-6 border-t-2 border-neutral-400">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>LÍQUIDO A COBRAR</h3>
                {liquidacion.redondeo && liquidacion.redondeo !== 0 && (
                  <p className="text-sm text-neutral-500 mt-1">
                    Redondeo: {formatCurrency(liquidacion.redondeo)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-4xl font-semibold text-terracotta-600" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                  {formatCurrency(liquidacion.liquidoACobrar)}
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {liquidacion.observaciones && (
            <div className="mt-6 pt-6 border-t border-neutral-300">
              <h4 className="text-sm font-semibold text-neutral-700 mb-2">Observaciones</h4>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                {liquidacion.observaciones}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

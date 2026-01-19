// Planilla Mensual de Turnos (dividida en semanas)
'use client'

import { useState, useEffect } from 'react'
import { useRestaurante } from '@/contexts/RestauranteContext'
import { calcularHorarioTurno } from '@/lib/utils'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface EmpleadoTurno {
  id: string
  nombre: string
  apellido: string
  horarioEntrada: string | null
  horarioSalida: string | null
  diasDescanso: Record<string, string>
  ajustes: Record<string, { tipoAjuste: string; minutosAfectados: number | null }>
  restaurantes: Array<{ id: string; nombre: string }>
}

interface Semana {
  numero: number
  fechas: Array<{ dia: string; fecha: Date; fechaKey: string }>
}

export default function TurnosPage() {
  const { restauranteActivo } = useRestaurante()
  const [empleados, setEmpleados] = useState<EmpleadoTurno[]>([])
  const [loading, setLoading] = useState(true)
  const [mesActual, setMesActual] = useState(new Date())
  const [semanas, setSemanas] = useState<Semana[]>([])

  useEffect(() => {
    calcularSemanasDelMes(mesActual)
    fetchTurnos()
  }, [restauranteActivo?.id, mesActual])

  function calcularSemanasDelMes(fecha: Date) {
    const año = fecha.getFullYear()
    const mes = fecha.getMonth()
    
    // Primer día del mes
    const primerDia = new Date(año, mes, 1)
    // Último día del mes
    const ultimoDia = new Date(año, mes + 1, 0)
    
    // Obtener el primer lunes del mes (o el primer día si es lunes)
    const primerLunes = new Date(primerDia)
    const diaSemanaPrimero = primerDia.getDay()
    const diasHastaLunes = diaSemanaPrimero === 0 ? 6 : diaSemanaPrimero - 1
    primerLunes.setDate(primerDia.getDate() - diasHastaLunes)
    
    // Calcular todas las semanas
    const semanasArray: Semana[] = []
    let fechaActual = new Date(primerLunes)
    let numeroSemana = 1
    
    while (fechaActual <= ultimoDia || fechaActual.getMonth() === mes) {
      const semana: Semana = {
        numero: numeroSemana,
        fechas: [],
      }
      
      // Llenar la semana con 7 días (empezando desde el primer lunes)
      for (let i = 0; i < 7; i++) {
        const fechaDia = new Date(fechaActual)
        fechaDia.setDate(fechaActual.getDate() + i)
        const diaSemana = fechaDia.getDay()
        // Convertir: domingo (0) -> índice 6, lunes (1) -> índice 0, etc.
        const indiceDia = diaSemana === 0 ? 6 : diaSemana - 1
        const nombreDia = DIAS_SEMANA[indiceDia]
        
        semana.fechas.push({
          dia: nombreDia,
          fecha: new Date(fechaDia),
          fechaKey: fechaDia.toISOString().split('T')[0],
        })
      }
      
      semanasArray.push(semana)
      fechaActual.setDate(fechaActual.getDate() + 7)
      numeroSemana++
      
      // Salir si ya pasamos el último día del mes
      if (fechaActual > ultimoDia && fechaActual.getMonth() !== mes) {
        break
      }
    }
    
    setSemanas(semanasArray)
  }

  async function fetchTurnos() {
    try {
      setLoading(true)
      const url = restauranteActivo
        ? `/api/turnos/semanal?restauranteId=${restauranteActivo.id}`
        : '/api/turnos/semanal'
      
      // Agregar timeout de 10 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Error al cargar turnos: ${response.status}`)
      }
      const data = await response.json()
      setEmpleados(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Error al cargar turnos:', error)
      if (error.name === 'AbortError') {
        console.error('Timeout: La petición tardó demasiado')
      }
      setEmpleados([])
    } finally {
      setLoading(false)
    }
  }

  function getTurnoParaFecha(empleado: EmpleadoTurno, fechaKey: string, dia: string) {
    // Buscar ajuste para esta fecha
    const ajuste = empleado.ajustes[fechaKey] || null
    
    const resultado = calcularHorarioTurno(
      dia,
      empleado.diasDescanso,
      empleado.horarioEntrada,
      empleado.horarioSalida,
      ajuste
    )
    return resultado
  }

  function getClaseCelda(tipo: string, tieneAjuste?: boolean, esFueraMes?: boolean): string {
    const baseClasses = 'text-center'
    const ajusteClass = tieneAjuste ? 'border-2 border-terracotta-400' : ''
    const fueraMesClass = esFueraMes ? 'bg-neutral-50 opacity-50' : ''
    
    if (esFueraMes) {
      return `${baseClasses} ${fueraMesClass}`
    }
    
    switch (tipo) {
      case 'libre':
        return `bg-neutral-100 text-neutral-600 ${baseClasses} ${ajusteClass}`
      case 'falta':
        return `bg-red-50 text-red-700 border border-red-200 ${baseClasses} ${ajusteClass}`
      case 'medio-mañana':
      case 'medio-tarde':
        return `bg-paper-50 text-paper-800 border border-paper-200 ${baseClasses} ${ajusteClass}`
      case 'ajustado':
        return `bg-terracotta-50 text-terracotta-800 border border-terracotta-200 ${baseClasses} ${ajusteClass}`
      case 'completo':
      default:
        return `bg-white ${baseClasses} ${ajusteClass}`
    }
  }

  function cambiarMes(direccion: number) {
    const nuevoMes = new Date(mesActual)
    nuevoMes.setMonth(mesActual.getMonth() + direccion)
    setMesActual(nuevoMes)
  }

  function irAMesActual() {
    setMesActual(new Date())
  }

  const nombreMes = mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-neutral-600 mb-2" style={{ fontWeight: 400, lineHeight: 1.6 }}>Cargando planilla...</div>
          <div className="text-xs text-neutral-400" style={{ fontWeight: 300, lineHeight: 1.6 }}>Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Planilla Mensual de Turnos</h1>
          <p className="text-neutral-600">
            {restauranteActivo && (
              <Badge variant="primary" className="mr-2">
                {restauranteActivo.nombre}
              </Badge>
            )}
            {nombreMes}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => cambiarMes(-1)}
            className="btn btn-ghost btn-sm"
          >
            ← Anterior
          </button>
          <button
            onClick={irAMesActual}
            className="btn btn-secondary btn-sm"
          >
            Hoy
          </button>
          <button
            onClick={() => cambiarMes(1)}
            className="btn btn-ghost btn-sm"
          >
            Siguiente →
          </button>
          <Link href="/ajustes-turno">
            <Button size="sm">
              Ajustes
            </Button>
          </Link>
        </div>
      </div>

      {empleados.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              {restauranteActivo
                ? 'No hay empleados asignados a este restaurante'
                : 'No hay empleados activos'}
            </p>
          </div>
        </div>
      ) : empleados.every(emp => !emp.horarioEntrada || !emp.horarioSalida) ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              Los empleados no tienen horarios configurados. Por favor, configura los horarios de entrada y salida en la sección de empleados.
            </p>
            <Link href="/empleados" className="btn btn-primary">
              Ir a Empleados
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {semanas.map((semana) => {
            const fechasDelMes = semana.fechas.filter(f => {
              const fechaObj = new Date(f.fechaKey)
              return fechaObj.getMonth() === mesActual.getMonth()
            })
            
            if (fechasDelMes.length === 0) return null
            
            return (
              <div key={semana.numero} className="card">
                <div className="card-header bg-neutral-50">
                  <h3 className="text-sm font-semibold text-neutral-700">
                    Semana {semana.numero} - {fechasDelMes[0]?.fecha.getDate()} al {fechasDelMes[fechasDelMes.length - 1]?.fecha.getDate()} de {nombreMes.split(' ')[0]}
                  </h3>
                </div>
                <div className="card-body p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200">
                            Empleado
                          </th>
                          {DIAS_SEMANA.map((diaNombre, index) => {
                            const fechaSemana = semana.fechas.find(f => f.dia === diaNombre)
                            if (!fechaSemana) return null
                            const esFueraMes = new Date(fechaSemana.fechaKey).getMonth() !== mesActual.getMonth()
                            return (
                              <th
                                key={`${semana.numero}-${index}`}
                                className={`px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[120px] ${esFueraMes ? 'bg-neutral-50' : ''}`}
                              >
                                <div>{DIAS_SEMANA_CORTOS[index]}</div>
                                <div className={`text-xs font-normal mt-1 ${esFueraMes ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                  {esFueraMes ? '' : new Date(fechaSemana.fechaKey).getDate()}
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {empleados.map((empleado) => {
                          const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`
                          return (
                            <tr key={empleado.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-neutral-200 font-medium" style={{ fontWeight: 500, color: '#111111' }}>
                                {nombreCompleto}
                              </td>
                              {DIAS_SEMANA.map((diaNombre, index) => {
                                const fechaSemana = semana.fechas.find(f => f.dia === diaNombre)
                                if (!fechaSemana) {
                                  return (
                                    <td key={`${semana.numero}-${empleado.id}-${index}`} className="px-4 py-3"></td>
                                  )
                                }
                                const esFueraMes = new Date(fechaSemana.fechaKey).getMonth() !== mesActual.getMonth()
                                const turno = getTurnoParaFecha(empleado, fechaSemana.fechaKey, fechaSemana.dia)
                                return (
                                  <td
                                    key={`${semana.numero}-${empleado.id}-${index}`}
                                    className={`px-4 py-3 whitespace-nowrap ${getClaseCelda(turno.tipo, turno.tieneAjuste, esFueraMes)}`}
                                  >
                                    {esFueraMes ? (
                                      <span className="text-xs text-neutral-400">-</span>
                                    ) : turno.tipo === 'libre' ? (
                                      <span className="text-xs font-medium">Libre</span>
                                    ) : turno.tipo === 'falta' ? (
                                      <span className="text-xs font-medium">Falta</span>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{turno.horario || '-'}</span>
                                        {turno.tieneAjuste && (
                                          <span className="text-xs text-terracotta-600 mt-1 font-medium" title="Ajuste aplicado" style={{ fontWeight: 500 }}>
                                            Ajustado
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leyenda */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-sm font-semibold text-[#111111] mb-3" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Leyenda</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white border border-neutral-200 rounded"></div>
              <span className="text-neutral-700">Turno completo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span className="text-neutral-700">Medio día</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-neutral-100 border border-neutral-200 rounded"></div>
              <span className="text-neutral-700">Día libre</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-50 border-2 border-blue-300 rounded"></div>
              <span className="text-neutral-700">Con ajuste</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

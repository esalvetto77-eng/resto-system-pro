// Funciones para calcular horas trabajadas y sueldos
import { parseJSON } from './utils'

/**
 * Calcula las horas trabajadas en un día específico
 */
export function calcularHorasDelDia(
  horarioEntrada: string | null,
  horarioSalida: string | null,
  dia: string,
  diasDescanso: Record<string, string>,
  ajuste: {
    tipoAjuste: string
    minutosAfectados: number | null
  } | null
): {
  horas: number
  minutos: number
  horasDecimales: number
  tipoDia: 'completo' | 'medio' | 'libre' | 'falta'
} {
  // Si hay ajuste de falta, retornar 0 horas
  if (ajuste && ajuste.tipoAjuste === 'falta') {
    return { horas: 0, minutos: 0, horasDecimales: 0, tipoDia: 'falta' }
  }

  // Si no hay horarios configurados
  if (!horarioEntrada || !horarioSalida) {
    return { horas: 0, minutos: 0, horasDecimales: 0, tipoDia: 'libre' }
  }

  // Calcular horario base según días de descanso
  const tipoDescanso = diasDescanso[dia]
  
  if (tipoDescanso === 'completo') {
    return { horas: 0, minutos: 0, horasDecimales: 0, tipoDia: 'libre' }
  }

  try {
    const [hEntrada, mEntrada] = horarioEntrada.split(':').map(Number)
    const [hSalida, mSalida] = horarioSalida.split(':').map(Number)
    
    let minutosEntrada = hEntrada * 60 + mEntrada
    let minutosSalida = hSalida * 60 + mSalida
    
    // Ajustar según medio día
    if (tipoDescanso === 'medio-mañana' || tipoDescanso === 'medio-tarde') {
      const minutosTotales = minutosSalida - minutosEntrada
      const minutosMedio = Math.floor(minutosTotales / 2)
      
      if (tipoDescanso === 'medio-mañana') {
        minutosEntrada = minutosEntrada + minutosMedio
      } else {
        minutosSalida = minutosEntrada + minutosMedio
      }
    }
    
    // Aplicar ajustes de turno
    if (ajuste && ajuste.tipoAjuste !== 'falta') {
      const minutosAjuste = ajuste.minutosAfectados || 0
      
      switch (ajuste.tipoAjuste) {
        case 'horas_extra':
          minutosSalida += minutosAjuste
          break
        case 'llegada_tarde':
          minutosEntrada += minutosAjuste
          break
        case 'salida_anticipada':
          minutosSalida += minutosAjuste // minutosAfectados será negativo
          break
      }
    }
    
    const minutosTrabajados = minutosSalida - minutosEntrada
    
    if (minutosTrabajados <= 0) {
      return { horas: 0, minutos: 0, horasDecimales: 0, tipoDia: 'libre' }
    }
    
    const horas = Math.floor(minutosTrabajados / 60)
    const minutos = minutosTrabajados % 60
    const horasDecimales = minutosTrabajados / 60
    
    const tipoDia = (tipoDescanso === 'medio-mañana' || tipoDescanso === 'medio-tarde') ? 'medio' : 'completo'
    
    return { horas, minutos, horasDecimales, tipoDia }
  } catch {
    return { horas: 0, minutos: 0, horasDecimales: 0, tipoDia: 'libre' }
  }
}

/**
 * Calcula el sueldo según el tipo de sueldo
 */
export function calcularSueldo(
  tipoSueldo: string,
  sueldoBase: number | null,
  valorHoraExtra: number | null,
  horasTrabajadas: number,
  horasExtra: number,
  diasTrabajados: number,
  diasCompletos: number,
  diasMedios: number,
  faltas: number,
  horasMensualesTeoricas: number = 160 // Por defecto 160 horas mensuales
): {
  montoBase: number
  montoHorasExtra: number
  montoDescuentos: number
  totalPagar: number
} {
  if (!sueldoBase || sueldoBase <= 0) {
    return { montoBase: 0, montoHorasExtra: 0, montoDescuentos: 0, totalPagar: 0 }
  }

  let montoBase = 0
  let montoHorasExtra = 0
  let montoDescuentos = 0

  switch (tipoSueldo.toUpperCase()) {
    case 'MENSUAL':
      // Sueldo mensual fijo
      montoBase = sueldoBase
      
      // Descuento por faltas (proporcional)
      if (faltas > 0) {
        const valorDia = sueldoBase / 30 // Suponiendo 30 días laborables
        montoDescuentos = valorDia * faltas
      }
      
      // Horas extra se pagan aparte
      if (horasExtra > 0 && valorHoraExtra) {
        montoHorasExtra = horasExtra * valorHoraExtra
      } else if (horasExtra > 0) {
        // Si no hay valorHoraExtra definido, usar proporcional del sueldo mensual
        const valorHora = sueldoBase / horasMensualesTeoricas
        montoHorasExtra = horasExtra * valorHora * 1.5 // 1.5x para horas extra
      }
      break

    case 'JORNAL':
      // Cada día completo suma un jornal
      montoBase = diasCompletos * sueldoBase
      // Medio día suma medio jornal
      montoBase += diasMedios * (sueldoBase / 2)
      // Faltas no suman (ya están excluidas)
      break

    case 'POR_HORA':
      // Horas normales
      const horasNormales = horasTrabajadas - horasExtra
      montoBase = horasNormales * sueldoBase
      
      // Horas extra con valor diferente si está definido
      if (horasExtra > 0) {
        if (valorHoraExtra) {
          montoHorasExtra = horasExtra * valorHoraExtra
        } else {
          montoHorasExtra = horasExtra * sueldoBase * 1.5 // 1.5x si no está definido
        }
      }
      break

    default:
      // Por defecto, tratar como mensual
      montoBase = sueldoBase
  }

  const totalPagar = montoBase + montoHorasExtra - montoDescuentos

  return {
    montoBase: Math.max(0, montoBase),
    montoHorasExtra: Math.max(0, montoHorasExtra),
    montoDescuentos: Math.max(0, montoDescuentos),
    totalPagar: Math.max(0, totalPagar),
  }
}

/**
 * Obtiene el nombre del día de la semana a partir de una fecha
 */
export function obtenerNombreDia(fecha: Date): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const diaNumero = fecha.getDay()
  return dias[diaNumero]
}

/**
 * Calcula todas las horas trabajadas en un período
 */
export function calcularHorasPeriodo(
  fechaInicio: Date,
  fechaFin: Date,
  horarioEntrada: string | null,
  horarioSalida: string | null,
  diasDescanso: Record<string, string>,
  ajustes: Record<string, { tipoAjuste: string; minutosAfectados: number | null }>
): {
  horasBase: number
  horasExtra: number
  horasTrabajadas: number
  horasDescontadas: number
  diasTrabajados: number
  diasCompletos: number
  diasMedios: number
  faltas: number
  detalleDias: Array<{
    fecha: string
    dia: string
    horas: number
    tipoDia: string
  }>
} {
  let horasBase = 0
  let horasExtra = 0
  let horasDescontadas = 0
  let diasTrabajados = 0
  let diasCompletos = 0
  let diasMedios = 0
  let faltas = 0
  const detalleDias: Array<{ fecha: string; dia: string; horas: number; tipoDia: string }> = []

  const fechaActual = new Date(fechaInicio)
  
  while (fechaActual <= fechaFin) {
    const fechaKey = fechaActual.toISOString().split('T')[0]
    const nombreDia = obtenerNombreDia(fechaActual)
    const ajuste = ajustes[fechaKey] || null

    const calculo = calcularHorasDelDia(
      horarioEntrada,
      horarioSalida,
      nombreDia,
      diasDescanso,
      ajuste
    )

    if (calculo.tipoDia === 'falta') {
      faltas++
    } else if (calculo.horasDecimales > 0) {
      horasBase += calculo.horasDecimales
      
      // Calcular horas extra del ajuste
      if (ajuste && ajuste.tipoAjuste === 'horas_extra' && ajuste.minutosAfectados) {
        const horasExtraDelAjuste = ajuste.minutosAfectados / 60
        horasExtra += horasExtraDelAjuste
      }
      
      // Calcular horas descontadas
      if (ajuste && (ajuste.tipoAjuste === 'llegada_tarde' || ajuste.tipoAjuste === 'salida_anticipada')) {
        const minutosDescontados = ajuste.minutosAfectados || 0
        if (minutosDescontados > 0) {
          horasDescontadas += minutosDescontados / 60
        }
      }

      diasTrabajados++
      if (calculo.tipoDia === 'completo') {
        diasCompletos++
      } else if (calculo.tipoDia === 'medio') {
        diasMedios++
      }

      detalleDias.push({
        fecha: fechaKey,
        dia: nombreDia,
        horas: calculo.horasDecimales,
        tipoDia: calculo.tipoDia,
      })
    }

    fechaActual.setDate(fechaActual.getDate() + 1)
  }

  const horasTrabajadas = horasBase + horasExtra - horasDescontadas

  return {
    horasBase,
    horasExtra,
    horasTrabajadas: Math.max(0, horasTrabajadas),
    horasDescontadas,
    diasTrabajados,
    diasCompletos,
    diasMedios,
    faltas,
    detalleDias,
  }
}

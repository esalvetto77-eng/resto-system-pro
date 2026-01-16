// Sistema de Liquidación Salarial Profesional - Uruguay
// IMPORTANTE: El sueldo del empleado es el LÍQUIDO pactado, no el nominal
// El sistema calcula el nominal necesario para alcanzar ese líquido

/**
 * Calcula los descuentos legales de Uruguay sobre un nominal
 * @param nominal Nominal (base para descuentos)
 * @returns Objeto con todos los descuentos legales
 */
export function calcularDescuentosLegales(nominal: number): {
  aporteJubilatorio: number // 15%
  frl: number // 0.1%
  seguroEnfermedad: number // 3%
  snis: number // 1.5%
  total: number
} {
  const aporteJubilatorio = Math.round(nominal * 0.15 * 100) / 100 // 15%
  const frl = Math.round(nominal * 0.001 * 100) / 100 // 0.1%
  const seguroEnfermedad = Math.round(nominal * 0.03 * 100) / 100 // 3%
  const snis = Math.round(nominal * 0.015 * 100) / 100 // 1.5%

  const total = aporteJubilatorio + frl + seguroEnfermedad + snis

  return {
    aporteJubilatorio,
    frl,
    seguroEnfermedad,
    snis,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Calcula el IRPF según tabla de BPS Uruguay
 * @param baseImponible Base imponible para IRPF (nominal - descuentos legales base)
 * @returns Monto de IRPF
 */
export function calcularIRPF(baseImponible: number): number {
  // Tabla IRPF simplificada (2024)
  if (baseImponible <= 119315) {
    return 0 // Exento
  }
  
  let irpf = 0
  
  // Primer tramo: 119315 a 170450 (10%)
  if (baseImponible > 119315) {
    const tramo1 = Math.min(baseImponible, 170450) - 119315
    irpf += tramo1 * 0.10
  }
  
  // Segundo tramo: 170450 a 298287 (15%)
  if (baseImponible > 170450) {
    const tramo2 = Math.min(baseImponible, 298287) - 170450
    irpf += tramo2 * 0.15
  }
  
  // Tercer tramo: > 298287 (20%)
  if (baseImponible > 298287) {
    const tramo3 = baseImponible - 298287
    irpf += tramo3 * 0.20
  }
  
  return Math.round(irpf * 100) / 100
}

/**
 * Calcula el nominal necesario a partir del líquido pactado
 * El cálculo es iterativo porque el IRPF depende del nominal
 * @param liquidoPactado Líquido que se quiere alcanzar
 * @returns Nominal calculado
 */
export function calcularNominalDesdeLiquido(liquidoPactado: number): number {
  // Validar que el líquido sea mayor a 0
  if (liquidoPactado <= 0) {
    return 0
  }
  
  // Sin IRPF, los descuentos son: 15% + 0.1% + 3% + 1.5% = 19.6%
  // Líquido = Nominal * (1 - 0.196) = Nominal * 0.804
  // Nominal = Líquido / 0.804
  
  // Aproximación inicial sin IRPF
  let nominal = liquidoPactado / 0.804
  
  // Iterar para ajustar por IRPF (máximo 10 iteraciones para convergencia)
  for (let i = 0; i < 10; i++) {
    const descuentosBase = calcularDescuentosLegales(nominal)
    const baseImponible = nominal - descuentosBase.total
    const irpf = calcularIRPF(baseImponible)
    
    const liquidoCalculado = nominal - descuentosBase.total - irpf
    const diferencia = liquidoPactado - liquidoCalculado
    
    // Si la diferencia es muy pequeña (< 1 peso), convergimos
    if (Math.abs(diferencia) < 1) {
      break
    }
    
    // Ajustar el nominal: si el líquido calculado es menor, aumentar nominal
    // Factor de ajuste: diferencia / (1 - 0.196) aproximado
    nominal += diferencia / 0.804
  }
  
  return Math.round(nominal * 100) / 100
}

/**
 * Calcula la liquidación completa para un mes
 * IMPORTANTE: El sueldoBaseMensual del empleado es el LÍQUIDO pactado
 */
export interface EventoMensualData {
  tipoEvento: string
  cantidad?: number
  valorUnitario?: number
  monto: number
  fecha: Date
}

export interface EmpleadoLiquidacionData {
  tipoRemuneracion: string // "MENSUAL" | "JORNAL"
  sueldoBaseMensual?: number // LÍQUIDO pactado (NO nominal)
  valorJornal?: number // Valor del jornal (líquido o nominal según corresponda)
  valorHoraNormal?: number
  valorHoraExtra?: number
  ticketAlimentacion: boolean
  valorTicketDiario?: number
}

export interface LiquidacionResult {
  // HABERES
  nominalCalculado: number // Nominal calculado a partir del líquido pactado
  sueldoBasico: number // Sueldo base (nominal)
  jornalesDescontados: number
  horasExtras: number
  montoHorasExtras: number
  ticketAlimentacion: number
  diasTicket: number
  totalHaberes: number
  totalGravado: number // Total gravado (nominal + horas extra)
  
  // DESCUENTOS LEGALES
  aporteJubilatorio: number
  frl: number
  seguroEnfermedad: number
  snis: number
  irpfBaseImponible: number
  irpfMonto: number
  totalDescuentosLegales: number
  
  // DESCUENTOS GENERALES
  adelantosEfectivo: number
  adelantosConsumiciones: number
  descuentosManuales: number
  totalDescuentosGenerales: number
  
  // TOTALES
  totalDescuentos: number
  liquidoACobrar: number
  liquidoPactado: number // Líquido pactado original
  diferenciaLiquido: number // Diferencia entre líquido a cobrar y líquido pactado
  redondeo?: number
}

/**
 * Calcula la liquidación completa para un mes
 */
export function calcularLiquidacion(
  empleado: EmpleadoLiquidacionData,
  eventos: EventoMensualData[],
  mes: number,
  anio: number,
  irpfAdelantado?: number,
  irpfMesesSinIRPF?: number
): LiquidacionResult {
  // 1. OBTENER LÍQUIDO PACTADO
  let liquidoPactado = 0
  
  if (empleado.tipoRemuneracion === 'MENSUAL') {
    liquidoPactado = empleado.sueldoBaseMensual || 0
  } else if (empleado.tipoRemuneracion === 'JORNAL') {
    // Para jornal, el valorJornal es por día (líquido o nominal según corresponda)
    // Por ahora asumimos que es el jornal líquido y calculamos el nominal por jornal
    const jornalLiquido = empleado.valorJornal || 0
    const diasMes = new Date(anio, mes, 0).getDate()
    liquidoPactado = jornalLiquido * diasMes
  }
  
  // 2. CALCULAR NOMINAL NECESARIO A PARTIR DEL LÍQUIDO PACTADO
  const nominalCalculado = calcularNominalDesdeLiquido(liquidoPactado)
  
  // 3. CALCULAR DESCUENTOS LEGALES SOBRE EL NOMINAL BASE
  const descuentosLegalesBase = calcularDescuentosLegales(nominalCalculado)
  
  // 4. CALCULAR IRPF
  let irpfMonto = 0
  let irpfBaseImponible = nominalCalculado - descuentosLegalesBase.total
  
  if (irpfMesesSinIRPF && irpfMesesSinIRPF > 0) {
    irpfMonto = 0
  } else {
    irpfMonto = calcularIRPF(irpfBaseImponible)
    if (irpfAdelantado) {
      irpfMonto = Math.max(0, irpfMonto - irpfAdelantado)
    }
  }
  
  // 5. CALCULAR SUELDO BASE (es el nominal, pero lo mostramos como sueldo básico)
  let sueldoBasico = nominalCalculado
  let jornalesDescontados = 0
  
  // Descontar jornales por faltas
  const faltas = eventos.filter(e => e.tipoEvento === 'FALTA')
  if (faltas.length > 0) {
    if (empleado.tipoRemuneracion === 'JORNAL') {
      const diasFaltas = faltas.reduce((sum, f) => sum + (f.cantidad || 0), 0)
      const jornalLiquido = empleado.valorJornal || 0
      const jornalNominal = calcularNominalDesdeLiquido(jornalLiquido)
      jornalesDescontados = diasFaltas * jornalNominal
      sueldoBasico = Math.max(0, nominalCalculado - jornalesDescontados)
    } else {
      // Para mensual, descontar proporcionalmente
      const diasFaltas = faltas.reduce((sum, f) => sum + (f.cantidad || 0), 0)
      const diasMes = new Date(anio, mes, 0).getDate()
      const descuentoPorFaltas = (nominalCalculado / diasMes) * diasFaltas
      jornalesDescontados = descuentoPorFaltas
      sueldoBasico = Math.max(0, nominalCalculado - descuentoPorFaltas)
    }
  }
  
  // 6. CALCULAR HORAS EXTRAS
  const eventosHorasExtra = eventos.filter(e => e.tipoEvento === 'HORAS_EXTRA')
  const horasExtras = eventosHorasExtra.reduce((sum, e) => sum + (e.cantidad || 0), 0)
  const montoHorasExtras = eventosHorasExtra.reduce((sum, e) => {
    if (e.monto) {
      return sum + e.monto
    }
    const valor = e.valorUnitario || empleado.valorHoraExtra || 0
    return sum + (e.cantidad || 0) * valor
  }, 0)
  
  // 7. CALCULAR TICKET ALIMENTACIÓN
  let ticketAlimentacion = 0
  let diasTicket = 0
  if (empleado.ticketAlimentacion && empleado.valorTicketDiario) {
    const diasMes = new Date(anio, mes, 0).getDate()
    const diasFaltas = faltas.reduce((sum, f) => sum + (f.cantidad || 0), 0)
    diasTicket = diasMes - diasFaltas
    ticketAlimentacion = diasTicket * (empleado.valorTicketDiario || 0)
  }
  
  // 8. TOTAL DE HABERES
  const totalHaberes = sueldoBasico + montoHorasExtras + ticketAlimentacion
  
  // 9. TOTAL GRAVADO (nominal base + horas extra)
  const totalGravado = sueldoBasico + montoHorasExtras
  
  // 10. RECALCULAR DESCUENTOS LEGALES SOBRE EL TOTAL GRAVADO REAL
  const descuentosLegales = calcularDescuentosLegales(totalGravado)
  
  // Recalcular IRPF sobre el nuevo total gravado
  irpfBaseImponible = totalGravado - descuentosLegales.total
  if (!(irpfMesesSinIRPF && irpfMesesSinIRPF > 0)) {
    irpfMonto = calcularIRPF(irpfBaseImponible)
    if (irpfAdelantado) {
      irpfMonto = Math.max(0, irpfMonto - irpfAdelantado)
    }
  }
  
  const totalDescuentosLegales = descuentosLegales.total + irpfMonto
  
  // 11. DESCUENTOS GENERALES (NO afectan aportes)
  const adelantosEfectivo = eventos
    .filter(e => e.tipoEvento === 'ADELANTO_EFECTIVO')
    .reduce((sum, e) => sum + e.monto, 0)
  
  const adelantosConsumiciones = eventos
    .filter(e => e.tipoEvento === 'ADELANTO_CONSUMICIONES')
    .reduce((sum, e) => sum + e.monto, 0)
  
  const descuentosManuales = eventos
    .filter(e => e.tipoEvento === 'DESCUENTO_MANUAL')
    .reduce((sum, e) => sum + e.monto, 0)
  
  const totalDescuentosGenerales = adelantosEfectivo + adelantosConsumiciones + descuentosManuales
  
  // 12. TOTALES
  const totalDescuentos = totalDescuentosLegales + totalDescuentosGenerales
  const liquidoACobrar = totalHaberes - totalDescuentos
  
  // 13. DIFERENCIA RESPECTO AL LÍQUIDO PACTADO
  const diferenciaLiquido = liquidoACobrar - liquidoPactado
  
  // 14. REDONDEO
  const redondeo = Math.round(liquidoACobrar) - liquidoACobrar
  const liquidoFinal = Math.round(liquidoACobrar)
  
  return {
    nominalCalculado: Math.round(nominalCalculado * 100) / 100,
    sueldoBasico: Math.round(sueldoBasico * 100) / 100,
    jornalesDescontados: Math.round(jornalesDescontados * 100) / 100,
    horasExtras: Math.round(horasExtras * 100) / 100,
    montoHorasExtras: Math.round(montoHorasExtras * 100) / 100,
    ticketAlimentacion: Math.round(ticketAlimentacion * 100) / 100,
    diasTicket,
    totalHaberes: Math.round(totalHaberes * 100) / 100,
    totalGravado: Math.round(totalGravado * 100) / 100,
    aporteJubilatorio: descuentosLegales.aporteJubilatorio,
    frl: descuentosLegales.frl,
    seguroEnfermedad: descuentosLegales.seguroEnfermedad,
    snis: descuentosLegales.snis,
    irpfBaseImponible: Math.round(irpfBaseImponible * 100) / 100,
    irpfMonto: Math.round(irpfMonto * 100) / 100,
    totalDescuentosLegales: Math.round(totalDescuentosLegales * 100) / 100,
    adelantosEfectivo: Math.round(adelantosEfectivo * 100) / 100,
    adelantosConsumiciones: Math.round(adelantosConsumiciones * 100) / 100,
    descuentosManuales: Math.round(descuentosManuales * 100) / 100,
    totalDescuentosGenerales: Math.round(totalDescuentosGenerales * 100) / 100,
    totalDescuentos: Math.round(totalDescuentos * 100) / 100,
    liquidoACobrar: liquidoFinal,
    liquidoPactado: Math.round(liquidoPactado * 100) / 100,
    diferenciaLiquido: Math.round(diferenciaLiquido * 100) / 100,
    redondeo: redondeo !== 0 ? Math.round(redondeo * 100) / 100 : undefined,
  }
}

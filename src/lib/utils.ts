export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function parseJSON<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export function calcularEstadoInventario(stockActual: number, stockMinimo: number): 'OK' | 'REPOSICION' {
  return stockActual >= stockMinimo ? 'OK' : 'REPOSICION'
}

export function calcularHorasTrabajadas(entrada: string | null, salida: string | null): string {
  if (!entrada || !salida) return '-'
  
  try {
    const [hEntrada, mEntrada] = entrada.split(':').map(Number)
    const [hSalida, mSalida] = salida.split(':').map(Number)
    
    const minutosEntrada = hEntrada * 60 + mEntrada
    const minutosSalida = hSalida * 60 + mSalida
    const minutosTrabajados = minutosSalida - minutosEntrada
    
    if (minutosTrabajados < 0) return '-'
    
    const horas = Math.floor(minutosTrabajados / 60)
    const minutos = minutosTrabajados % 60
    
    return `${horas}:${minutos.toString().padStart(2, '0')}`
  } catch {
    return '-'
  }
}

export function fechaVencida(fecha: Date | string | null | undefined): boolean {
  if (!fecha) return false
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return d < new Date()
}

export function fechaVencePronto(fecha: Date | string | null | undefined): boolean {
  if (!fecha) return false
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const hoy = new Date()
  const en30Dias = new Date()
  en30Dias.setDate(hoy.getDate() + 30)
  return d >= hoy && d <= en30Dias
}

export function calcularHorarioTurno(
  dia: string,
  diasDescanso: Record<string, string>,
  horarioEntrada: string | null,
  horarioSalida: string | null,
  ajuste?: {
    tipoAjuste: string
    minutosAfectados: number | null
  } | null
): { tipo: 'completo' | 'medio-mañana' | 'medio-tarde' | 'libre' | 'falta' | 'ajustado'; horario?: string; tieneAjuste?: boolean } {
  if (ajuste && ajuste.tipoAjuste === 'falta') {
    return { tipo: 'falta', tieneAjuste: true }
  }

  if (!horarioEntrada || !horarioSalida) {
    return { tipo: 'libre' }
  }

  const tipoDescanso = diasDescanso[dia]
  
  let horarioBase: { entrada: number; salida: number } = { entrada: 0, salida: 0 }
  
  try {
    const [hEntrada, mEntrada] = horarioEntrada.split(':').map(Number)
    const [hSalida, mSalida] = horarioSalida.split(':').map(Number)
    
    const minutosEntrada = hEntrada * 60 + mEntrada
    const minutosSalida = hSalida * 60 + mSalida
    
    if (!tipoDescanso) {
      horarioBase = { entrada: minutosEntrada, salida: minutosSalida }
    } else if (tipoDescanso === 'completo') {
      return { tipo: 'libre' }
    } else {
      const minutosTotales = minutosSalida - minutosEntrada
      const minutosMedio = Math.floor(minutosTotales / 2)
      
      if (tipoDescanso === 'medio-mañana') {
        horarioBase = { entrada: minutosEntrada + minutosMedio, salida: minutosSalida }
      } else if (tipoDescanso === 'medio-tarde') {
        horarioBase = { entrada: minutosEntrada, salida: minutosEntrada + minutosMedio }
      } else {
        horarioBase = { entrada: minutosEntrada, salida: minutosSalida }
      }
    }
  } catch {
    return { tipo: 'completo', horario: `${horarioEntrada} – ${horarioSalida}` }
  }

  if (ajuste && ajuste.tipoAjuste && ajuste.tipoAjuste !== 'falta') {
    let entradaAjustada = horarioBase.entrada
    let salidaAjustada = horarioBase.salida

    switch (ajuste.tipoAjuste) {
      case 'horas_extra':
        if (ajuste.minutosAfectados) {
          salidaAjustada += ajuste.minutosAfectados
        }
        break
      case 'llegada_tarde':
        if (ajuste.minutosAfectados) {
          entradaAjustada += ajuste.minutosAfectados
        }
        break
      case 'salida_anticipada':
        if (ajuste.minutosAfectados) {
          salidaAjustada += ajuste.minutosAfectados
        }
        break
    }

    const hEntradaFinal = Math.floor(entradaAjustada / 60) % 24
    const mEntradaFinal = entradaAjustada % 60
    const hSalidaFinal = Math.floor(salidaAjustada / 60) % 24
    const mSalidaFinal = salidaAjustada % 60

    const horarioEntradaFinal = `${hEntradaFinal.toString().padStart(2, '0')}:${mEntradaFinal.toString().padStart(2, '0')}`
    const horarioSalidaFinal = `${hSalidaFinal.toString().padStart(2, '0')}:${mSalidaFinal.toString().padStart(2, '0')}`

    return {
      tipo: 'ajustado',
      horario: `${horarioEntradaFinal} – ${horarioSalidaFinal}`,
      tieneAjuste: true,
    }
  }

  const hEntradaBase = Math.floor(horarioBase.entrada / 60) % 24
  const mEntradaBase = horarioBase.entrada % 60
  const hSalidaBase = Math.floor(horarioBase.salida / 60) % 24
  const mSalidaBase = horarioBase.salida % 60

  const horarioEntradaBase = `${hEntradaBase.toString().padStart(2, '0')}:${mEntradaBase.toString().padStart(2, '0')}`
  const horarioSalidaBase = `${hSalidaBase.toString().padStart(2, '0')}:${mSalidaBase.toString().padStart(2, '0')}`

  if (!tipoDescanso) {
    return { tipo: 'completo', horario: `${horarioEntradaBase} – ${horarioSalidaBase}` }
  } else if (tipoDescanso === 'medio-mañana') {
    return { tipo: 'medio-tarde', horario: `${horarioEntradaBase} – ${horarioSalidaBase}` }
  } else if (tipoDescanso === 'medio-tarde') {
    return { tipo: 'medio-mañana', horario: `${horarioEntradaBase} – ${horarioSalidaBase}` }
  }

  return { tipo: 'completo', horario: `${horarioEntradaBase} – ${horarioSalidaBase}` }
}

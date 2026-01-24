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

export function fechaVenceEn15Dias(fecha: Date | string | null | undefined): boolean {
  if (!fecha) return false
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0) // Resetear horas para comparar solo fechas
  const en15Dias = new Date()
  en15Dias.setDate(hoy.getDate() + 15)
  en15Dias.setHours(23, 59, 59, 999) // Fin del día 15
  const fechaVencimiento = new Date(d)
  fechaVencimiento.setHours(0, 0, 0, 0)
  
  // Vence en los próximos 15 días (incluyendo hoy)
  return fechaVencimiento >= hoy && fechaVencimiento <= en15Dias && !fechaVencida(fecha)
}

// Tipos para cotización del dólar
export interface CotizacionBROU {
  compra: number
  venta: number
  fecha: string
  fuente: string
}

// Función para obtener cotización del BROU (compartida)
export async function obtenerCotizacionBROU(): Promise<CotizacionBROU | null> {
  try {
    // Intentar múltiples fuentes para obtener la cotización del BROU
    
    // Fuente 1: Intentar obtener desde la página del BROU (scraping)
    try {
      const brouResponse = await fetch('https://www.brou.com.uy/web/guest/cotizaciones', {
        next: { revalidate: 3600 }, // Cache por 1 hora
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      
      if (brouResponse.ok) {
        const html = await brouResponse.text()
        // Buscar patrones comunes en la página del BROU
        // El BROU muestra la cotización en formato específico
        const compraMatch = html.match(/compra.*?(\d+[.,]\d+)/i)
        const ventaMatch = html.match(/venta.*?(\d+[.,]\d+)/i)
        
        if (compraMatch && ventaMatch) {
          const compra = parseFloat(compraMatch[1].replace(',', '.'))
          const venta = parseFloat(ventaMatch[1].replace(',', '.'))
          
          if (compra > 35 && compra < 45 && venta > 35 && venta < 45 && venta > compra) {
            return {
              compra,
              venta,
              fecha: new Date().toISOString().split('T')[0],
              fuente: 'BROU (web oficial)',
            }
          }
        }
      }
    } catch (brouError) {
      console.warn('[COTIZACION] No se pudo obtener desde BROU web:', brouError)
    }
    
    // Fuente 2: API alternativa - exchangerate-api
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        next: { revalidate: 3600 },
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const tasaUYU = data.rates?.UYU
        
        if (tasaUYU && tasaUYU >= 35 && tasaUYU <= 45) {
          const spread = 0.75
          return {
            compra: tasaUYU - spread / 2,
            venta: tasaUYU + spread / 2,
            fecha: new Date().toISOString().split('T')[0],
            fuente: 'BROU (via API alternativa)',
          }
        }
      }
    } catch (apiError) {
      console.warn('[COTIZACION] No se pudo obtener desde API alternativa:', apiError)
    }
    
    // Fuente 3: Variable de entorno (tiene prioridad sobre defaults)
    const cotizacionManual = process.env.COTIZACION_DOLAR_BROU
    if (cotizacionManual) {
      const valor = parseFloat(cotizacionManual)
      if (!isNaN(valor) && valor > 0) {
        const spread = 0.75
        return {
          compra: valor - spread / 2,
          venta: valor + spread / 2,
          fecha: new Date().toISOString().split('T')[0],
          fuente: 'BROU (configuración manual)',
        }
      }
    }
    
    // Valor por defecto si todo falla (enero 2026: ~38.9 UYU)
    const valorDefault = 38.9
    const spread = 0.75
    return {
      compra: valorDefault - spread / 2,
      venta: valorDefault + spread / 2,
      fecha: new Date().toISOString().split('T')[0],
      fuente: 'BROU (valor por defecto)',
    }
  } catch (error) {
    console.error('[COTIZACION] Error al obtener cotización del BROU:', error)
    
    // Fallback final: variable de entorno o valor por defecto
    const cotizacionManual = process.env.COTIZACION_DOLAR_BROU
    if (cotizacionManual) {
      const valor = parseFloat(cotizacionManual)
      if (!isNaN(valor) && valor > 0) {
        const spread = 0.75
        return {
          compra: valor - spread / 2,
          venta: valor + spread / 2,
          fecha: new Date().toISOString().split('T')[0],
          fuente: 'BROU (configuración manual)',
        }
      }
    }
    
    const valorDefault = 38.9
    const spread = 0.75
    return {
      compra: valorDefault - spread / 2,
      venta: valorDefault + spread / 2,
      fecha: new Date().toISOString().split('T')[0],
      fuente: 'BROU (valor por defecto)',
    }
  }
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

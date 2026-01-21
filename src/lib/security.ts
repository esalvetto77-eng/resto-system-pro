// Utilidades de seguridad

/**
 * Sanitizar string para prevenir XSS
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .trim()
    .slice(0, 1000) // Limitar longitud
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.toLowerCase())
}

/**
 * Validar que un string no contenga caracteres peligrosos
 */
export function isSafeString(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') return false
  
  // No permitir caracteres peligrosos para SQL/JS
  const dangerousChars = /[<>'"\\;{}[\]()]/g
  return !dangerousChars.test(input)
}

/**
 * Validar longitud de string
 */
export function validateLength(
  input: string | null | undefined,
  min: number = 1,
  max: number = 1000
): boolean {
  if (!input) return min === 0
  return input.length >= min && input.length <= max
}

/**
 * Sanitizar número
 */
export function sanitizeNumber(input: any): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input
  }
  
  if (typeof input === 'string') {
    const num = parseFloat(input)
    return isNaN(num) ? null : num
  }
  
  return null
}

/**
 * Validar que un número esté en un rango
 */
export function validateNumberRange(
  value: number | null,
  min: number,
  max: number
): boolean {
  if (value === null || isNaN(value)) return false
  return value >= min && value <= max
}

/**
 * Generar mensaje de error genérico (no exponer detalles sensibles)
 */
export function getGenericError(message: string = 'Error en la operación'): {
  error: string
} {
  // En producción, no exponer detalles del error
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  
  return {
    error: isProduction ? message : message,
  }
}

/**
 * Validar formato de fecha
 */
export function isValidDate(date: any): boolean {
  if (!date) return false
  
  const d = new Date(date)
  return !isNaN(d.getTime())
}

/**
 * Sanitizar objeto para prevenir inyección
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const sanitized: Partial<T> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>]
      } else if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value) as T[Extract<keyof T, string>]
      } else if (typeof value === 'boolean') {
        sanitized[key] = value
      } else if (value === null || value === undefined) {
        sanitized[key] = value
      }
      // Ignorar otros tipos (objetos, arrays, etc.) por seguridad
    }
  }
  
  return sanitized
}

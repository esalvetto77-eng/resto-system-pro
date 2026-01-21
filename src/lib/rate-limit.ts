// Rate limiting simple en memoria
// Para producción, considera usar Redis o un servicio externo

interface RateLimitStore {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitStore>()
// Nota: en serverless evitamos setInterval. Limpieza “lazy” dentro de rateLimit().

export interface RateLimitOptions {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo de requests en la ventana
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Rate limiting simple por IP
 * @param identifier Identificador único (IP, email, etc.)
 * @param options Opciones de rate limiting
 * @returns Resultado del rate limit
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, maxRequests: 5 }
): RateLimitResult {
  const now = Date.now()
  const key = identifier.toLowerCase()

  // Limpieza lazy: si la entrada expiró, se elimina al consultar
  const existing = store.get(key)

  if (!existing || existing.resetTime < now) {
    // Nueva ventana o ventana expirada
    store.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    }
  }

  if (existing.count >= options.maxRequests) {
    // Límite excedido
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  // Incrementar contador
  existing.count++
  store.set(key, existing)

  return {
    success: true,
    remaining: options.maxRequests - existing.count,
    resetTime: existing.resetTime,
  }
}

/**
 * Obtener IP del request
 */
export function getClientIP(request: Request): string {
  // Intentar obtener IP de headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (no debería llegar aquí en producción)
  return 'unknown'
}

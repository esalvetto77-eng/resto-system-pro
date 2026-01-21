import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Headers de seguridad adicionales
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Protección CSRF básica para API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const method = request.method
    
    // Para métodos que modifican datos, verificar origen
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const origin = request.headers.get('origin')
      
      // En producción, verificar que el origen sea válido
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
      
      if (isProduction) {
        // Validación estricta: comparar hostname exacto (evita bypass por substring)
        if (origin) {
          try {
            const originHost = new URL(origin).hostname
            const requestHost = request.nextUrl.hostname
            if (originHost !== requestHost) {
              return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
            }
          } catch {
            return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
          }
        }
      }
    }
  }

  return response
}

// Aplicar middleware a todas las rutas excepto estáticas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

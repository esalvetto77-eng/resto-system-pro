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
      const referer = request.headers.get('referer')
      
      // En producción, verificar que el origen sea válido
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
      
      if (isProduction) {
        // Permitir requests sin origin/referer solo si vienen de la misma app
        // Vercel maneja esto automáticamente, pero agregamos validación adicional
        const host = request.headers.get('host')
        if (origin && !origin.includes(host || '')) {
          // Origen sospechoso
          return NextResponse.json(
            { error: 'Origen no permitido' },
            { status: 403 }
          )
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

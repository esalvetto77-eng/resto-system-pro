// API Route para login
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { isValidEmail, sanitizeString, getGenericError } from '@/lib/security'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
// Prisma no funciona en Edge runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // No cachear

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 5 intentos por IP cada 15 minutos
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`login:${clientIP}`, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5, // 5 intentos
    })

    if (!rateLimitResult.success) {
      console.warn('[AUTH] Rate limit excedido para IP:', clientIP)
      return NextResponse.json(
        { 
          error: 'Demasiados intentos de inicio de sesión. Por favor, intenta nuevamente en unos minutos.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    let { email, password } = body

    // Sanitizar y validar email
    email = sanitizeString(email)
    
    if (!email || !password) {
      console.log('[AUTH] Login error: Email o contraseña faltantes')
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      console.log('[AUTH] Login error: Email inválido:', email)
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 4 || password.length > 100) {
      console.log('[AUTH] Login error: Contraseña con longitud inválida')
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 400 }
      )
    }

    console.log('[AUTH] Login intento:', { email: email.toLowerCase(), passwordProvided: !!password, ip: clientIP })

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    console.log('[AUTH] Usuario encontrado:', usuario ? { id: usuario.id, email: usuario.email, rol: usuario.rol, activo: usuario.activo } : 'NO ENCONTRADO')

    if (!usuario) {
      // Log de intento fallido (sin exponer información sensible)
      console.warn('[AUTH] Login fallido:', {
        email: email.toLowerCase(),
        ip: clientIP,
        timestamp: new Date().toISOString(),
        motivo: 'Usuario no encontrado',
      })
      
      // No exponer si el usuario existe o no (timing attack protection)
      // Usar el mismo mensaje genérico y simular verificación de contraseña
      // para evitar timing attacks
      await verifyPassword('dummy', '$2a$10$dummyhashfordummyverification')
      
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifica tu email y contraseña.' },
        { status: 401 }
      )
    }

    if (!usuario.activo) {
      console.log('[AUTH] Login error: Usuario inactivo:', usuario.email)
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacta al administrador.' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const passwordValid = await verifyPassword(password, usuario.password)
    console.log('[AUTH] Verificación de contraseña:', passwordValid ? 'VÁLIDA' : 'INVÁLIDA')

    if (!passwordValid) {
      // Log de intento fallido (sin exponer información sensible)
      console.warn('[AUTH] Login fallido:', {
        email: usuario.email,
        ip: clientIP,
        timestamp: new Date().toISOString(),
        motivo: 'Contraseña incorrecta',
      })
      
      // No exponer si el usuario existe o no (timing attack protection)
      // Usar el mismo mensaje genérico
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifica tu email y contraseña.' },
        { status: 401 }
      )
    }

    // Establecer cookie de sesión
    // IMPORTANTE: Solo guardamos userId, NO el rol
    // El rol se obtiene de la DB en cada request para garantizar consistencia
    
    // Detectar si estamos en Vercel (producción)
    // Vercel usa HTTPS automáticamente, así que secure debe ser true
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    const isVercel = process.env.VERCEL === '1'
    
    const cookieStore = await cookies()
    cookieStore.set('userId', usuario.id, {
      httpOnly: true, // No accesible desde JavaScript (seguridad)
      secure: isProduction, // true en producción/Vercel (HTTPS requerido)
      sameSite: 'lax', // Compatible con navegación desde otros sitios
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/', // Disponible en toda la aplicación
      // No especificamos 'domain' - Vercel maneja esto automáticamente
    })

    // LOG: Login exitoso (sin información sensible en logs)
    console.log('[AUTH] Login exitoso:', {
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      ip: clientIP,
      timestamp: new Date().toISOString(),
      fuenteRol: 'Base de Datos (Prisma)',
      cookie: 'userId guardado en cookie (httpOnly)',
      ambiente: isVercel ? 'Vercel (Producción)' : isProduction ? 'Producción' : 'Desarrollo',
    })

    // Retornar usuario (sin contraseña)
    // El frontend guardará este rol en estado React
    const response = NextResponse.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol, // Rol desde DB
    })
    
    // Headers de seguridad
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-RateLimit-Limit', '5')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return response
  } catch (error) {
    // No exponer detalles del error en producción
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    console.error('[AUTH] Error en login:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json(
      getGenericError('Error al iniciar sesión. Por favor, intenta nuevamente.'),
      { status: 500 }
    )
  }
}

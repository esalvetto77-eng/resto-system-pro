// API Route para login
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
// Prisma no funciona en Edge runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // No cachear

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[AUTH] Login intento:', { email, passwordProvided: !!password })

    if (!email || !password) {
      console.log('[AUTH] Login error: Email o contraseña faltantes')
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    console.log('[AUTH] Usuario encontrado:', usuario ? { id: usuario.id, email: usuario.email, rol: usuario.rol, activo: usuario.activo } : 'NO ENCONTRADO')

    if (!usuario) {
      console.log('[AUTH] Login error: Usuario no encontrado para email:', email.toLowerCase())
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
      console.log('[AUTH] Login error: Contraseña incorrecta para usuario:', usuario.email)
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

    // LOG: Login exitoso
    console.log('[AUTH] Login exitoso:', {
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      fuenteRol: 'Base de Datos (Prisma)',
      cookie: 'userId guardado en cookie (httpOnly)',
      ambiente: isVercel ? 'Vercel (Producción)' : isProduction ? 'Producción' : 'Desarrollo',
      cookieConfig: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      },
      nota: 'El rol NO se guarda en cookie, se consulta de DB en cada request',
    })

    // Retornar usuario (sin contraseña)
    // El frontend guardará este rol en estado React
    const response = NextResponse.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol, // Rol desde DB
    })
    
    // Headers para evitar caché
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    
    return response
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}

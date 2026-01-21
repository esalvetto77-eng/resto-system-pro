// API Route para solicitar recuperación de contraseña
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/password-reset'
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email'
import { isValidEmail, sanitizeString } from '@/lib/security'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 3 solicitudes por IP cada hora
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`forgot-password:${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3, // 3 intentos
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Por favor, intenta nuevamente más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Verificar que el email esté configurado
    if (!isEmailConfigured()) {
      console.error('[AUTH] Email no configurado para recuperación de contraseña')
      return NextResponse.json(
        { error: 'Servicio de recuperación de contraseña no disponible temporalmente' },
        { status: 503 }
      )
    }

    const body = await request.json()
    let { email } = body

    // Sanitizar y validar email
    email = sanitizeString(email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      // No revelar si el email existe o no (seguridad)
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' },
        { status: 200 }
      )
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, activo: true },
    })

    // No revelar si el usuario existe o no (seguridad)
    // Siempre retornar el mismo mensaje
    if (!usuario || !usuario.activo) {
      // Simular el mismo tiempo de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 500))
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' },
        { status: 200 }
      )
    }

    // Crear token de recuperación
    const resetToken = await createPasswordResetToken(usuario.id)

    // Construir URL de recuperación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3002'
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    // Enviar email
    try {
      await sendPasswordResetEmail(usuario.email, resetToken, resetUrl)
      
      console.log('[AUTH] Email de recuperación enviado:', {
        email: usuario.email,
        ip: clientIP,
        timestamp: new Date().toISOString(),
      })
    } catch (emailError) {
      console.error('[AUTH] Error al enviar email de recuperación:', emailError)
      // No revelar el error al usuario
      return NextResponse.json(
        { message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña',
    })
  } catch (error) {
    console.error('[AUTH] Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

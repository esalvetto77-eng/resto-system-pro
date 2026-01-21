// API Route para restablecer contraseña con token
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateResetToken, markTokenAsUsed } from '@/lib/password-reset'
import { hashPassword } from '@/lib/auth'
import { validateLength } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, nuevaPassword, confirmPassword } = body

    if (!token || !nuevaPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, nueva contraseña y confirmación son requeridos' },
        { status: 400 }
      )
    }

    // Validar que las contraseñas coincidan
    if (nuevaPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (!validateLength(nuevaPassword, 12, 200)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener entre 12 y 200 caracteres' },
        { status: 400 }
      )
    }

    // Validar que tenga al menos una letra y un número
    const tieneLetra = /[a-zA-Z]/.test(nuevaPassword)
    const tieneNumero = /[0-9]/.test(nuevaPassword)

    if (!tieneLetra || !tieneNumero) {
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos una letra y un número' },
        { status: 400 }
      )
    }

    // Validar token
    const tokenValidation = await validateResetToken(token)

    if (!tokenValidation.valid || !tokenValidation.userId) {
      return NextResponse.json(
        { error: tokenValidation.error || 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(nuevaPassword)

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: tokenValidation.userId },
      data: { password: hashedPassword },
    })

    // Marcar token como usado
    await markTokenAsUsed(token)

    console.log('[AUTH] Contraseña restablecida exitosamente:', {
      userId: tokenValidation.userId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    })
  } catch (error) {
    console.error('[AUTH] Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña' },
      { status: 500 }
    )
  }
}

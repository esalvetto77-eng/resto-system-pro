// API Route para cambiar contraseña de un usuario
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth'
import { validateLength } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Solo admin puede cambiar contraseñas de otros usuarios
    // Los usuarios pueden cambiar su propia contraseña
    const puedeCambiar = isAdmin(currentUser) || currentUser.id === params.id

    if (!puedeCambiar) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden cambiar contraseñas de otros usuarios.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const nuevaPassword = typeof body?.nuevaPassword === 'string' ? body.nuevaPassword : ''
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : ''

    // Validar que ambas contraseñas estén presentes
    if (!nuevaPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Nueva contraseña y confirmación son requeridas' },
        { status: 400 }
      )
    }

    // Validar que coincidan
    if (nuevaPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    // Validación fuerte (recomendado)
    // - mínimo 12 caracteres
    // - máximo 200
    if (!validateLength(nuevaPassword, 12, 200)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener entre 12 y 200 caracteres' },
        { status: 400 }
      )
    }

    // Reglas básicas de complejidad (sin ser excesivo)
    const hasLetter = /[A-Za-z]/.test(nuevaPassword)
    const hasNumber = /\d/.test(nuevaPassword)
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { error: 'La contraseña debe incluir al menos una letra y un número' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(nuevaPassword)

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    })

    // Log (sin exponer la contraseña)
    console.log('[AUTH] Contraseña cambiada:', {
      usuarioId: params.id,
      email: usuario.email,
      cambiadoPor: currentUser.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
      usuarioId: params.id,
    })
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}

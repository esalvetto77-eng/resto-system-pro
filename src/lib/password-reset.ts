// Utilidades para recuperación de contraseña
import crypto from 'crypto'
import { prisma } from './prisma'

/**
 * Generar token seguro para recuperación de contraseña
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash del token para guardarlo en la base de datos
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Crear token de recuperación para un usuario
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Generar token
  const token = generateResetToken()
  const hashedToken = hashResetToken(token)

  // Expiración: 1 hora
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  // Guardar en la base de datos
  // Nota: Si ya existe un token, lo actualizamos
  await prisma.passwordResetToken.upsert({
    where: { userId },
    update: {
      token: hashedToken,
      expiresAt,
      used: false,
    },
    create: {
      userId,
      token: hashedToken,
      expiresAt,
      used: false,
    },
  })

  return token
}

/**
 * Validar token de recuperación
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean
  userId: string | null
  error?: string
}> {
  const hashedToken = hashResetToken(token)

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedToken,
      used: false,
      expiresAt: {
        gt: new Date(), // No expirado
      },
    },
    include: {
      user: {
        select: {
          id: true,
          activo: true,
        },
      },
    },
  })

  if (!resetToken) {
    return {
      valid: false,
      userId: null,
      error: 'Token inválido o expirado',
    }
  }

  if (!resetToken.user.activo) {
    return {
      valid: false,
      userId: null,
      error: 'Usuario inactivo',
    }
  }

  return {
    valid: true,
    userId: resetToken.userId,
  }
}

/**
 * Marcar token como usado
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashResetToken(token)
  await prisma.passwordResetToken.updateMany({
    where: {
      token: hashedToken,
      used: false,
    },
    data: {
      used: true,
    },
  })
}

/**
 * Limpiar tokens expirados (ejecutar periódicamente)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true },
      ],
    },
  })
}

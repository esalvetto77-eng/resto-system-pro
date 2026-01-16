// Utilidades de autenticación
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const ROLES = {
  ADMIN: 'ADMIN',
  ENCARGADO: 'ENCARGADO',
} as const

export type Rol = typeof ROLES[keyof typeof ROLES]

export interface UsuarioSession {
  id: string
  nombre: string
  email: string
  rol: Rol
}

// Obtener usuario de la sesión
export async function getCurrentUser(): Promise<UsuarioSession | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return null
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    })

    if (!usuario || !usuario.activo) {
      return null
    }

    return usuario as UsuarioSession
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return null
  }
}

// Verificar si el usuario tiene un rol específico
export function hasRole(user: UsuarioSession | null, role: Rol): boolean {
  if (!user) return false
  return user.rol === role
}

// Verificar si el usuario es admin
export function isAdmin(user: UsuarioSession | null): boolean {
  return hasRole(user, ROLES.ADMIN)
}

// Verificar si el usuario es encargado
export function isEncargado(user: UsuarioSession | null): boolean {
  return hasRole(user, ROLES.ENCARGADO)
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verificar contraseña
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

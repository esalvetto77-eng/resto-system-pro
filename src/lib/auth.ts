// Utilidades de autenticación
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { getSessionCookieNames, hasSessionSecret, verifySignedUserId } from './session'

export const ROLES = {
  ADMIN: 'ADMIN',
  DUENO: 'DUENO', // Dueño es equivalente a ADMIN
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
    const { primary, legacy } = getSessionCookieNames()
    const cookieValue = cookieStore.get(primary)?.value ?? cookieStore.get(legacy)?.value
    const { userId, signed } = cookieValue ? verifySignedUserId(cookieValue) : { userId: null, signed: false }

    // LOG: Validación de cookie
    if (!userId) {
      console.log('[AUTH] getCurrentUser: No hay sesión válida en cookie - Usuario no autenticado', {
        hasSecret: hasSessionSecret(),
        cookiePresent: Boolean(cookieValue),
        signedCookie: signed,
      })
      return null
    }

    console.log('[AUTH] getCurrentUser: userId desde cookie:', userId, {
      signedCookie: signed,
      hasSecret: hasSessionSecret(),
    })

    // FUENTE DE VERDAD: Base de Datos
    // El rol se obtiene directamente de la DB en cada request
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

    if (!usuario) {
      console.log('[AUTH] getCurrentUser: Usuario no encontrado en DB para userId:', userId)
      return null
    }

    if (!usuario.activo) {
      console.log('[AUTH] getCurrentUser: Usuario inactivo:', usuario.email)
      return null
    }

    // LOG: Rol obtenido desde DB
    console.log('[AUTH] getCurrentUser: Usuario encontrado -', {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      fuente: 'Base de Datos (Prisma)',
    })

    return usuario as UsuarioSession
  } catch (error) {
    console.error('[AUTH] getCurrentUser: Error al obtener usuario:', error)
    return null
  }
}

// Verificar si el usuario tiene un rol específico
export function hasRole(user: UsuarioSession | null, role: Rol): boolean {
  if (!user) return false
  return user.rol === role
}

// Verificar si el usuario es admin (ADMIN o DUENO)
export function isAdmin(user: UsuarioSession | null): boolean {
  if (!user) return false
  return user.rol === ROLES.ADMIN || user.rol === ROLES.DUENO
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

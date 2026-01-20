'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'DUENO' | 'ENCARGADO'
}

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: () => boolean
  isEncargado: () => boolean
  isDueño: () => boolean
  canEdit: () => boolean
  canSeePrices: () => boolean
  canDelete: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Redirigir a login si no está autenticado (excepto en la página de login)
    if (!loading && !user && pathname !== '/login') {
      router.push('/login')
    }
    // Redirigir a home si está autenticado y está en login
    if (!loading && user && pathname === '/login') {
      router.push('/')
    }
  }, [user, loading, pathname, router])

  const checkAuth = async () => {
    try {
      console.log('[FRONTEND] AuthContext.checkAuth: Verificando autenticación...')
      // CRÍTICO: No cachear request de autenticación
      // Cada verificación debe consultar DB para obtener rol actual
      const response = await fetch('/api/auth/me', {
        cache: 'no-store', // No cachear en navegador
        credentials: 'include', // Incluir cookies
      })
      if (response.ok) {
        const userData = await response.json()
        
        // LOG: Datos recibidos del backend
        console.log('[FRONTEND] AuthContext.checkAuth: Usuario recibido del backend:', {
          id: userData.id,
          email: userData.email,
          rol: userData.rol,
          fuente: 'Fetch a /api/auth/me -> getCurrentUser -> DB',
          timestamp: new Date().toISOString(),
        })
        
        setUser(userData)
        
        // Validación: Verificar que el rol sea válido
        if (userData.rol && !['ADMIN', 'ENCARGADO'].includes(userData.rol)) {
          console.warn('[FRONTEND] AuthContext.checkAuth: ⚠️ ROL INVÁLIDO:', userData.rol)
        } else {
          console.log('[FRONTEND] AuthContext.checkAuth: ✅ Rol válido:', userData.rol)
        }
      } else {
        console.log('[FRONTEND] AuthContext.checkAuth: No autenticado (status:', response.status, ')')
        setUser(null)
      }
    } catch (error) {
      console.error('[FRONTEND] AuthContext.checkAuth: Error al verificar autenticación:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al iniciar sesión')
      }

      const userData = await response.json()
      setUser(userData)
      router.push('/')
      router.refresh()
    } catch (error: any) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const isAdmin = () => {
    const result = user?.rol === 'ADMIN'
    // Nota: Solo loguear en AdminOnly para evitar spam
    return result
  }
  
  const isEncargado = () => user?.rol === 'ENCARGADO'
  const isDueño = () => isAdmin() // Dueño = ADMIN
  const canEdit = () => isAdmin() // Solo admin puede editar
  const canSeePrices = () => isAdmin() // Solo admin puede ver precios/montos
  const canDelete = () => isAdmin() // Solo dueño (ADMIN) puede eliminar permanentemente

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isEncargado,
        isDueño,
        canEdit,
        canSeePrices,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

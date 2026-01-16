'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'ENCARGADO'
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
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error)
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

  const isAdmin = () => user?.rol === 'ADMIN'
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

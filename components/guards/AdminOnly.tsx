'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AdminOnlyProps {
  children: React.ReactNode
}

/**
 * Componente guard que solo permite acceso a usuarios ADMIN (DUENO)
 * Redirige automáticamente si el usuario no es ADMIN
 */
export function AdminOnly({ children }: AdminOnlyProps) {
  const { isAdmin, loading, user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading) {
      const adminResult = isAdmin()
      
      // LOG: Validación en AdminOnly
      console.log('[GUARD] AdminOnly: Validando acceso:', {
        mounted,
        loading,
        user: user ? {
          email: user.email,
          rol: user.rol,
        } : null,
        esAdmin: adminResult,
        fuente: 'useAuth().isAdmin() -> Estado React -> DB',
        accion: adminResult ? '✅ Permitir acceso' : '❌ Redirigir a /',
      })
      
      if (!adminResult) {
        console.warn('[GUARD] AdminOnly: ⚠️ Acceso denegado - Redirigiendo a /')
        router.replace('/')
      }
    }
  }, [mounted, loading, isAdmin, router, user])

  // No renderizar hasta que esté montado y autenticado
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  // Si no es admin, no mostrar contenido (ya se está redirigiendo)
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Redirigiendo...</div>
      </div>
    )
  }

  return <>{children}</>
}

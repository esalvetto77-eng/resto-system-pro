'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminOnly } from '@/components/guards/AdminOnly'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'DUENO' | 'ENCARGADO'
  activo: boolean
  createdAt?: string
}

export default function SeguridadUsuariosPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [passwords, setPasswords] = useState<Record<string, { nueva: string; confirm: string; saving: boolean }>>({})

  const sortedUsuarios = useMemo(() => {
    return [...usuarios].sort((a, b) => a.email.localeCompare(b.email))
  }, [usuarios])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/usuarios', { cache: 'no-store', credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Error HTTP ${res.status}`)
      }
      const data = (await res.json()) as Usuario[]
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Error al cargar usuarios')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  const updateField = (userId: string, field: 'nueva' | 'confirm', value: string) => {
    setPasswords((prev) => ({
      ...prev,
      [userId]: {
        nueva: prev[userId]?.nueva ?? '',
        confirm: prev[userId]?.confirm ?? '',
        saving: prev[userId]?.saving ?? false,
        [field]: value,
      },
    }))
  }

  const handleChangePassword = async (targetUserId: string) => {
    setSuccess(null)
    setError(null)

    const state = passwords[targetUserId] || { nueva: '', confirm: '', saving: false }
    const nuevaPassword = state.nueva
    const confirmPassword = state.confirm

    setPasswords((prev) => ({
      ...prev,
      [targetUserId]: { ...state, saving: true },
    }))

    try {
      const res = await fetch(`/api/usuarios/${targetUserId}/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nuevaPassword, confirmPassword }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || `Error HTTP ${res.status}`)
      }

      setSuccess('Contraseña actualizada. El usuario debe volver a iniciar sesión.')
      setPasswords((prev) => ({
        ...prev,
        [targetUserId]: { nueva: '', confirm: '', saving: false },
      }))
    } catch (e: any) {
      setError(e?.message || 'Error al cambiar contraseña')
      setPasswords((prev) => ({
        ...prev,
        [targetUserId]: { ...state, saving: false },
      }))
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Seguridad
          </h1>
          <p className="text-neutral-600 mt-1">
            Cambiar contraseñas de usuarios (solo Dueño).
          </p>
        </div>

        {(error || success) && (
          <Card className={error ? 'border-paper-400 bg-paper-50' : 'border-terracotta-200 bg-terracotta-50'}>
            <CardBody className="p-4">
              <div className="text-sm" style={{ fontWeight: 400, lineHeight: 1.6 }}>
                {error ? <span className="text-paper-800">{error}</span> : <span className="text-terracotta-900">{success}</span>}
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Usuarios
              </h2>
              <Button variant="secondary" size="sm" onClick={loadUsuarios}>
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {loading ? (
              <div className="text-neutral-600">Cargando...</div>
            ) : (
              <div className="space-y-6">
                {sortedUsuarios.map((u) => {
                  const st = passwords[u.id] || { nueva: '', confirm: '', saving: false }
                  const isMe = user?.id === u.id
                  return (
                    <div key={u.id} className="border border-neutral-200 rounded-soft p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                            {u.nombre} {isMe ? '(Tu usuario)' : ''}
                          </div>
                          <div className="text-sm text-neutral-600">{u.email}</div>
                          <div className="text-xs text-neutral-500 mt-1">Rol: {u.rol}</div>
                        </div>
                        <div className="w-full max-w-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="text-xs text-neutral-600">Nueva contraseña</div>
                              <input
                                type="password"
                                value={st.nueva}
                                onChange={(e) => updateField(u.id, 'nueva', e.target.value)}
                                className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                                placeholder="Mínimo 12 caracteres"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-neutral-600">Confirmar</div>
                              <input
                                type="password"
                                value={st.confirm}
                                onChange={(e) => updateField(u.id, 'confirm', e.target.value)}
                                className="w-full px-3 py-2 rounded-soft border border-neutral-200 bg-white text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-3">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleChangePassword(u.id)}
                              disabled={st.saving}
                            >
                              {st.saving ? 'Guardando...' : 'Cambiar contraseña'}
                            </Button>
                          </div>
                          <div className="text-xs text-neutral-500 mt-2">
                            Requisitos: 12-200 caracteres, al menos una letra y un número.
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {sortedUsuarios.length === 0 && (
                  <div className="text-neutral-600">No hay usuarios.</div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminOnly>
  )
}


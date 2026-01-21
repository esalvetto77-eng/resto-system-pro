'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    if (!token) {
      setError('Token de recuperación no válido')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nuevaPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage(data.message || 'Contraseña restablecida exitosamente')
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'Error al restablecer la contraseña')
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-semibold text-[#111111]">Token Inválido</h1>
            </CardHeader>
            <CardBody>
              <p className="text-neutral-600 mb-4">
                El enlace de recuperación no es válido o ha expirado.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">Solicitar Nuevo Enlace</Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
              Restablecer Contraseña
            </h1>
            <p className="text-neutral-600 mt-2">
              Ingresa tu nueva contraseña. Debe tener al menos 12 caracteres e incluir letras y números.
            </p>
          </CardHeader>
          <CardBody>
            {success ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-soft text-green-700 text-sm">
                  {message}
                </div>
                <p className="text-sm text-neutral-600">
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nuevaPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="nuevaPassword"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                    placeholder="Mínimo 12 caracteres"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Debe incluir letras y números
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                    placeholder="Confirma tu contraseña"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-soft text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-terracotta-600 hover:text-terracotta-700">
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

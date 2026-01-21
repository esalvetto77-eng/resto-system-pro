'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Si el email existe, recibirás un enlace para restablecer tu contraseña')
      } else {
        setError(data.error || 'Error al procesar la solicitud')
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5 }}>
              Recuperar Contraseña
            </h1>
            <p className="text-neutral-600 mt-2">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-soft focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-soft text-green-700 text-sm">
                  {message}
                </div>
              )}

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
                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-terracotta-600 hover:text-terracotta-700">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

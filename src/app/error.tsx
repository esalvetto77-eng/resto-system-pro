'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="card max-w-md w-full">
        <div className="card-body text-center">
          <h2 className="text-2xl font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Algo salió mal
          </h2>
          <p className="text-[#111111] mb-6" style={{ fontWeight: 400, lineHeight: 1.6 }}>
            Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="btn btn-primary"
            >
              Intentar de nuevo
            </button>
            <Link href="/" className="btn btn-ghost">
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

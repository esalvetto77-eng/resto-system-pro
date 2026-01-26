'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddDatosPagoFieldsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    yaExistian?: boolean
  } | null>(null)

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-neutral-600 mb-4">
            Solo los administradores pueden acceder a esta página.
          </p>
          <Link href="/" className="btn btn-primary">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleAddFields = async () => {
    if (!confirm('¿Estás seguro de que deseas agregar los campos de datos de pago (número de cuenta y banco) a la tabla proveedores?')) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/add-datos-pago-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          yaExistian: data.yaExistian,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Error desconocido',
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error?.message || 'Error al agregar los campos',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Agregar Campos de Datos de Pago
          </h1>
          <p className="text-neutral-600 mt-1">
            Agregar los campos número de cuenta y banco a la tabla proveedores en la base de datos
          </p>
        </div>
        <Link href="/proveedores" className="btn btn-ghost">
          Volver a Proveedores
        </Link>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              ¿Qué hace esto?
            </h2>
            <p className="text-neutral-600">
              Este proceso agregará las columnas <code className="bg-neutral-100 px-2 py-1 rounded">numero_cuenta</code> y <code className="bg-neutral-100 px-2 py-1 rounded">banco</code> a la tabla <code className="bg-neutral-100 px-2 py-1 rounded">proveedores</code> en la base de datos de producción.
            </p>
            <p className="text-neutral-600 mt-2">
              Esto es necesario para que los campos de datos de pago funcionen correctamente al crear y editar proveedores.
            </p>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.message}
              </p>
              {result.yaExistian && (
                <p className="text-green-700 text-sm mt-2">
                  Los campos ya estaban presentes, no se realizaron cambios.
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleAddFields}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Agregando campos...' : 'Agregar Campos de Datos de Pago'}
            </button>
            <Link href="/proveedores" className="btn btn-ghost">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

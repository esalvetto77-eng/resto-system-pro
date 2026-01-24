'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function AddCurrencyFieldsPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleAddFields = async () => {
    if (!isAdmin()) {
      setResult({ error: 'No tienes permisos de administrador' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/add-currency-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ success: true, message: data.message || 'Campos de moneda agregados exitosamente' })
      } else {
        setResult({ error: data.error || data.message || 'Error desconocido' })
      }
    } catch (error: any) {
      setResult({ error: error.message || 'Error al ejecutar el endpoint' })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardBody>
            <p className="text-red-600">No tienes permisos para acceder a esta página.</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-[#111111] mb-2">
          Agregar Campos de Moneda
        </h1>
        <p className="text-neutral-600">
          Esta herramienta agrega los campos de moneda a la tabla producto_proveedor en la base de datos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-neutral-900">
            Instrucciones
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-neutral-700 mb-2">
              Esta acción agregará los siguientes campos a la tabla <code className="bg-neutral-100 px-2 py-1 rounded">producto_proveedor</code>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 ml-4">
              <li><code>moneda</code> (TEXT, default: 'UYU')</li>
              <li><code>precioEnDolares</code> (DOUBLE PRECISION)</li>
              <li><code>precioEnPesos</code> (DOUBLE PRECISION)</li>
              <li><code>cotizacionUsada</code> (DOUBLE PRECISION)</li>
              <li><code>fechaCotizacion</code> (TIMESTAMP)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Nota:</strong> Esta operación es segura. Si los campos ya existen, no se duplicarán.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleAddFields}
              disabled={loading}
              className="bg-terracotta-600 hover:bg-terracotta-700"
            >
              {loading ? 'Ejecutando...' : 'Agregar Campos de Moneda'}
            </Button>

            <Button
              onClick={() => router.push('/productos')}
              variant="ghost"
            >
              Cancelar
            </Button>
          </div>

          {result && (
            <div
              className={`p-4 rounded ${
                result.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {result.success ? (
                <div>
                  <p className="font-semibold">✅ Éxito</p>
                  <p className="text-sm mt-1">{result.message}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">❌ Error</p>
                  <p className="text-sm mt-1">{result.error}</p>
                </div>
              )}
            </div>
          )}

          {result?.success && (
            <div className="mt-4">
              <p className="text-sm text-neutral-600 mb-2">
                Los campos se han agregado exitosamente. Ahora puedes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 ml-4">
                <li>Crear productos con moneda USD</li>
                <li>Editar productos existentes y cambiar su moneda</li>
                <li>Ver los badges de moneda en la lista de productos</li>
              </ul>
              <div className="mt-4">
                <Button
                  onClick={() => router.push('/productos')}
                  className="bg-terracotta-600 hover:bg-terracotta-700"
                >
                  Ir a Productos
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

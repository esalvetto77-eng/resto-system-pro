// Página de listado de Restaurantes
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Restaurante {
  id: string
  nombre: string
  ubicacion: string | null
  activo: boolean
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRestaurantes() {
      try {
        const response = await fetch('/api/restaurantes')
        const data = await response.json()
        setRestaurantes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar restaurantes:', error)
        setRestaurantes([])
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurantes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando restaurantes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Restaurantes</h1>
          <p className="text-neutral-600 mt-1">
            Gestión de restaurantes y sucursales
          </p>
        </div>
        <Link href="/restaurantes/nuevo" className="btn btn-primary">
          + Nuevo Restaurante
        </Link>
      </div>

      {restaurantes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              No hay restaurantes registrados
            </p>
            <Link href="/restaurantes/nuevo" className="btn btn-primary">
              Crear primer restaurante
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {restaurantes.map((restaurante) => (
                  <tr key={restaurante.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {restaurante.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {restaurante.ubicacion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {restaurante.activo ? (
                        <span className="badge badge-success">Activo</span>
                      ) : (
                        <span className="badge badge-neutral">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/restaurantes/${restaurante.id}/editar`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

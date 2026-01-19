// Página para crear un nuevo restaurante
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminOnly } from '@/components/guards/AdminOnly'

export default function NuevoRestaurantePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.nombre.trim()) {
        alert('El nombre del restaurante es requerido')
        setLoading(false)
        return
      }

      const response = await fetch('/api/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          ubicacion: formData.ubicacion.trim() || null,
          activo: formData.activo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error al crear restaurante')
      }

      const result = await response.json()
      console.log('Restaurante creado exitosamente:', result)

      router.push('/restaurantes')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el restaurante'
      alert(`Error al crear el restaurante: ${errorMessage}`)
      setLoading(false)
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Nuevo Restaurante
          </h1>
          <p className="text-neutral-600 mt-1">
            Agregar un nuevo restaurante al sistema
          </p>
        </div>
        <Link href="/restaurantes" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          <div>
            <label className="label">Nombre del Restaurante *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: Sushi Central, Sucursal Norte"
            />
          </div>

          <div>
            <label className="label">Ubicación</label>
            <input
              type="text"
              className="input"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData({ ...formData, ubicacion: e.target.value })
              }
              placeholder="Ej: Av. Principal 123, Barrio Centro"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) =>
                  setFormData({ ...formData, activo: e.target.checked })
                }
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Restaurante activo
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link href="/restaurantes" className="btn btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
      </div>
    </AdminOnly>
  )
}

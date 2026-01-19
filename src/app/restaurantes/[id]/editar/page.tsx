// Página para editar un restaurante
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarRestaurantePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    activo: true,
  })

  useEffect(() => {
    async function fetchRestaurante() {
      try {
        const response = await fetch(`/api/restaurantes/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/restaurantes')
            return
          }
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(errorData.error || 'Error al cargar restaurante')
        }
        const data = await response.json()
        setFormData({
          nombre: data.nombre || '',
          ubicacion: data.ubicacion || '',
          activo: data.activo ?? true,
        })
      } catch (error: any) {
        console.error('Error:', error)
        alert(error?.message || 'Error al cargar el restaurante')
        router.push('/restaurantes')
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurante()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.nombre.trim()) {
        alert('El nombre del restaurante es requerido')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/restaurantes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          ubicacion: formData.ubicacion.trim() || null,
          activo: formData.activo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar restaurante')
      }

      router.push('/restaurantes')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Error al actualizar el restaurante')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Editar Restaurante
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar información del restaurante
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
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

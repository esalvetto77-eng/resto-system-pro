'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

const CATEGORIAS = [
  'Entrada',
  'Principal',
  'Postre',
  'Bebida',
  'Acompañamiento',
  'Salsa',
  'Otro',
]

interface IngredienteForm {
  productoId: string
  cantidad: number
  orden: number
  notas: string
}

export default function NuevaRecetaPage() {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(false)

  // Solo ADMIN puede crear recetas
  useEffect(() => {
    if (!canEdit()) {
      router.push('/recetas')
    }
  }, [canEdit, router])
  const [productos, setProductos] = useState<
    Array<{ id: string; nombre: string; unidad: string }>
  >([])
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porciones: 1,
    categoria: '',
    instrucciones: '',
    activo: true,
  })
  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([
    { productoId: '', cantidad: 0, orden: 0, notas: '' },
  ])

  useEffect(() => {
    async function fetchProductos() {
      try {
        const response = await fetch('/api/productos?activo=true')
        const data = await response.json()
        setProductos(data)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }
    fetchProductos()
  }, [])

  const addIngrediente = () => {
    setIngredientes([
      ...ingredientes,
      {
        productoId: '',
        cantidad: 0,
        orden: ingredientes.length,
        notas: '',
      },
    ])
  }

  const removeIngrediente = (index: number) => {
    const nuevos = ingredientes.filter((_, i) => i !== index)
    nuevos.forEach((ing, i) => {
      ing.orden = i
    })
    setIngredientes(nuevos)
  }

  const updateIngrediente = (
    index: number,
    field: keyof IngredienteForm,
    value: string | number
  ) => {
    const nuevos = [...ingredientes]
    if (field === 'cantidad' || field === 'orden') {
      nuevos[index][field] = Number(value)
    } else {
      nuevos[index][field] = value as string
    }
    setIngredientes(nuevos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit()) return // Prevent submission if not authorized

    const ingredientesValidos = ingredientes.filter(
      (ing) => ing.productoId !== '' && ing.cantidad > 0
    )

    if (ingredientesValidos.length === 0) {
      alert('Debe agregar al menos un ingrediente')
      return
    }

    if (!formData.nombre.trim()) {
      alert('Debe ingresar un nombre para la receta')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ingredientes: ingredientesValidos.map((ing) => ({
            productoId: ing.productoId,
            cantidad: ing.cantidad,
            orden: ing.orden,
            notas: ing.notas || null,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear receta')
      }

      router.push('/recetas')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al crear la receta')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Nueva Receta
          </h1>
          <p className="text-neutral-600 mt-1">
            Agregar una nueva receta al recetario
          </p>
        </div>
        <Link href="/recetas">
          <Button variant="ghost">Cancelar</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Información Básica
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                  Nombre de la Receta *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Risotto de Hongos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                  Descripción
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Breve descripción de la receta"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                    Porciones *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input"
                    value={formData.porciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        porciones: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                    Categoría
                  </label>
                  <select
                    className="input"
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                  >
                    <option value="">Seleccionar categoría</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                  Instrucciones
                </label>
                <textarea
                  className="input"
                  rows={6}
                  value={formData.instrucciones}
                  onChange={(e) =>
                    setFormData({ ...formData, instrucciones: e.target.value })
                  }
                  placeholder="Pasos de preparación..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Ingredientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  Ingredientes
                </h2>
                <button
                  type="button"
                  onClick={addIngrediente}
                  className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
                >
                  + Agregar Ingrediente
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {ingredientes.map((ing, index) => {
                  const producto = productos.find((p) => p.id === ing.productoId)
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-neutral-200 rounded-soft"
                    >
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                          Producto *
                        </label>
                        <select
                          required
                          className="input"
                          value={ing.productoId}
                          onChange={(e) =>
                            updateIngrediente(index, 'productoId', e.target.value)
                          }
                        >
                          <option value="">Seleccionar producto</option>
                          {productos.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                          Cantidad *
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="input"
                            value={ing.cantidad}
                            onChange={(e) =>
                              updateIngrediente(
                                index,
                                'cantidad',
                                e.target.value
                              )
                            }
                          />
                          {producto && (
                            <span className="text-sm text-neutral-500 whitespace-nowrap">
                              {producto.unidad}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontWeight: 500 }}>
                          Notas
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={ing.notas}
                          onChange={(e) =>
                            updateIngrediente(index, 'notas', e.target.value)
                          }
                          placeholder="Ej: picado fino"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        {ingredientes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIngrediente(index)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          {/* Estado */}
          <Card>
            <CardBody>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-terracotta-600 focus:ring-terracotta-500"
                />
                <span className="text-sm font-medium text-neutral-700" style={{ fontWeight: 500 }}>
                  Receta activa
                </span>
              </label>
            </CardBody>
          </Card>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link href="/recetas">
              <Button variant="ghost">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear Receta'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

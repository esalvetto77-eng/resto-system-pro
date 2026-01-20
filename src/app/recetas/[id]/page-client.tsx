'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'
import { calcularCostoReceta, formatCurrency } from '@/lib/utils/recetas'

interface Ingrediente {
  id: string
  cantidad: number
  orden: number
  notas: string | null
  producto: {
    id: string
    nombre: string
    unidad: string
    proveedores: Array<{
      precioCompra: number | null
      ordenPreferencia: number
      proveedor: {
        id: string
        nombre: string
        contacto: string | null
        telefono: string | null
      }
    }>
  }
}

interface Receta {
  id: string
  nombre: string
  descripcion: string | null
  porciones: number
  categoria: string | null
  instrucciones: string | null
  activo: boolean
  ingredientes: Ingrediente[]
}

export default function RecetaDetailPageClient({ id }: { id: string }) {
  const router = useRouter()
  const { canSeePrices, canEdit, canDelete } = useAuth()
  const [loading, setLoading] = useState(true)
  const [receta, setReceta] = useState<Receta | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchReceta() {
      try {
        const response = await fetch(`/api/recetas/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/recetas')
            return
          }
          throw new Error('Error al cargar receta')
        }
        const data = await response.json()
        setReceta(data)
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cargar la receta')
        router.push('/recetas')
      } finally {
        setLoading(false)
      }
    }
    fetchReceta()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  if (!receta) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-neutral-600 mb-4">Receta no encontrada</p>
          <Link href="/recetas">
            <Button>Volver a Recetas</Button>
          </Link>
        </CardBody>
      </Card>
    )
  }

  // Convertir ingredientes al formato esperado por calcularCostoReceta
  const ingredientesConPrecio = receta.ingredientes.map(ing => ({
    productoId: ing.producto.id,
    producto: ing.producto,
    cantidad: ing.cantidad,
    notas: ing.notas || null,
  }))
  const costo = calcularCostoReceta(ingredientesConPrecio, receta.porciones)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            {receta.nombre}
          </h1>
          <p className="text-neutral-600 mt-1">Detalle de la receta</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/recetas">
            <Button variant="ghost">Volver</Button>
          </Link>
          {canEdit() && (
            <Link href={`/recetas/${receta.id}/editar`}>
              <Button>Editar</Button>
            </Link>
          )}
          {canDelete() && (
            <button
              onClick={async () => {
                if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta receta? Esta acción no se puede deshacer.')) {
                  return
                }
                setDeleting(true)
                try {
                  const response = await fetch(`/api/recetas/${receta.id}`, {
                    method: 'DELETE',
                  })
                  if (!response.ok) throw new Error('Error al eliminar receta')
                  router.push('/recetas')
                  router.refresh()
                } catch (error: any) {
                  alert(error?.message || 'Error al eliminar la receta')
                } finally {
                  setDeleting(false)
                }
              }}
              disabled={deleting}
              className="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Información de la Receta
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {receta.descripcion && (
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-1" style={{ fontWeight: 500 }}>
                    Descripción
                  </div>
                  <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                    {receta.descripcion}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-1" style={{ fontWeight: 500 }}>
                    Porciones
                  </div>
                  <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                    {receta.porciones}
                  </div>
                </div>
                {receta.categoria && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500 mb-1" style={{ fontWeight: 500 }}>
                      Categoría
                    </div>
                    <Badge variant="neutral">{receta.categoria}</Badge>
                  </div>
                )}
              </div>
              {receta.instrucciones && (
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-2" style={{ fontWeight: 500 }}>
                    Instrucciones
                  </div>
                  <div className="text-base whitespace-pre-line" style={{ color: '#111111', lineHeight: 1.7 }}>
                    {receta.instrucciones}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Ingredientes */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Ingredientes
              </h2>
            </CardHeader>
            <CardBody>
              {receta.ingredientes.length > 0 ? (
                <div className="space-y-3">
                  {receta.ingredientes.map((ing, idx) => {
                    const costoIng = costo.ingredientes.find((ci) => ci.productoId === ing.productoId)
                    return (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between p-4 border border-neutral-200 rounded-soft"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                              {idx + 1}.
                            </span>
                            <span className="font-medium" style={{ color: '#111111', fontWeight: 500 }}>
                              {ing.producto.nombre}
                            </span>
                            {costoIng?.proveedor && (
                              <Badge variant="neutral" className="text-xs">
                                {costoIng.proveedor.nombre}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600 ml-6">
                            {ing.cantidad} {ing.producto.unidad}
                            {canSeePrices() && costoIng?.precioUnitario && (
                              <span className="ml-2 text-neutral-500">
                                @ <ProtectedPrice
                                  value={costoIng.precioUnitario}
                                  formatter={formatCurrency}
                                  fallback={<span>-</span>}
                                />
                              </span>
                            )}
                          </div>
                          {ing.notas && (
                            <div className="text-xs text-neutral-500 ml-6 mt-1 italic">
                              {ing.notas}
                            </div>
                          )}
                        </div>
                        {canSeePrices() && (
                          <div className="text-right">
                            {costoIng?.costoTotal !== null ? (
                              <ProtectedPrice
                                value={costoIng.costoTotal}
                                formatter={formatCurrency}
                                fallback={<span className="text-sm text-neutral-400">Sin precio</span>}
                                className="font-medium"
                              />
                            ) : (
                              <div className="text-sm text-neutral-400">Sin precio</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No hay ingredientes agregados
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - Costos */}
        {canSeePrices() && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  Costos
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-1" style={{ fontWeight: 500 }}>
                    Costo Total
                  </div>
                  <ProtectedPrice
                    value={costo.costoTotal}
                    formatter={formatCurrency}
                    fallback={<span className="text-2xl font-semibold text-neutral-400">-</span>}
                    className="text-2xl font-semibold"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-1" style={{ fontWeight: 500 }}>
                    Costo por Porción
                  </div>
                  <ProtectedPrice
                    value={costo.costoPorPorcion}
                    formatter={formatCurrency}
                    fallback={<span className="text-xl font-semibold text-neutral-400">-</span>}
                    className="text-xl font-semibold"
                  />
                </div>
                {costo.ingredientesSinPrecio.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="text-sm font-medium text-paper-700 mb-2" style={{ fontWeight: 500 }}>
                      Ingredientes sin precio
                    </div>
                    <ul className="text-sm text-paper-600 space-y-1">
                      {costo.ingredientesSinPrecio.map((nombre) => (
                        <li key={nombre}>• {nombre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  Estado
                </h2>
              </CardHeader>
              <CardBody>
                {receta.activo ? (
                  <Badge variant="success">Activa</Badge>
                ) : (
                  <Badge variant="neutral">Inactiva</Badge>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

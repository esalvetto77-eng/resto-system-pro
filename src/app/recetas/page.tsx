// Página de listado de Recetas
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { calcularCostoReceta, formatCurrency } from '@/lib/utils/recetas'
import { useAuth } from '@/contexts/AuthContext'

interface Receta {
  id: string
  nombre: string
  descripcion: string | null
  porciones: number
  categoria: string | null
  activo: boolean
  ingredientes: Array<{
    id: string
    cantidad: number
    orden: number
    producto: {
      id: string
      nombre: string
      unidad: string
      proveedores: Array<{
        precioCompra: number | null
        ordenPreferencia: number
        proveedor: { id: string; nombre: string }
      }>
    }
  }>
}

export default function RecetasPage() {
  const router = useRouter()
  const { canSeePrices, canDelete } = useAuth()
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecetas() {
      try {
        const response = await fetch('/api/recetas?activo=true')
        const data = await response.json()
        setRecetas(data)
      } catch (error) {
        console.error('Error al cargar recetas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecetas()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta receta? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/recetas/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar receta')
      }

      // Refrescar la lista
      await fetchRecetas()
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar receta:', error)
      alert(error?.message || 'Error al eliminar la receta')
    } finally {
      setDeletingId(null)
    }
  }

  async function fetchRecetas() {
    try {
      const response = await fetch('/api/recetas?activo=true')
      const data = await response.json()
      setRecetas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar recetas:', error)
      setRecetas([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando...</div>
      </div>
    )
  }

  // Calcular costos para cada receta
  const recetasConCosto = recetas.map((receta) => {
    const costo = calcularCostoReceta(receta.ingredientes, receta.porciones)
    return {
      ...receta,
      costo,
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Recetario
          </h1>
          <p className="text-neutral-600 mt-1">
            Base de recetas y cálculo de costos
          </p>
        </div>
        <Link href="/recetas/nuevo">
          <Button>
            + Nueva Receta
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {recetas.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              No hay recetas registradas
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Comienza agregando tu primera receta al recetario.
            </p>
            <Link href="/recetas/nuevo">
              <Button size="lg">
                Crear primera receta
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        /* Table */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Listado de Recetas
              </h2>
              <div className="text-sm text-neutral-600">
                {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Receta</TableCell>
                  <TableCell header>Categoría</TableCell>
                  <TableCell header>Porciones</TableCell>
                  <TableCell header>Ingredientes</TableCell>
                  {canSeePrices() && <TableCell header>Costo Total</TableCell>}
                  {canSeePrices() && <TableCell header>Costo por Porción</TableCell>}
                  <TableCell header className="text-right">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetasConCosto.map((receta) => (
                  <TableRow key={receta.id}>
                    <TableCell>
                      <div className="font-medium" style={{ color: '#111111', fontWeight: 500 }}>
                        {receta.nombre}
                      </div>
                      {receta.descripcion && (
                        <div className="text-sm text-neutral-500 mt-1">
                          {receta.descripcion}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {receta.categoria ? (
                        <Badge variant="neutral">{receta.categoria}</Badge>
                      ) : (
                        <span className="text-neutral-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {receta.porciones}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {receta.ingredientes.length} {receta.ingredientes.length === 1 ? 'ingrediente' : 'ingredientes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {receta.costo.ingredientesSinPrecio.length > 0 ? (
                        <div>
                          <div className="text-neutral-400 text-sm">
                            {formatCurrency(receta.costo.costoTotal)}
                          </div>
                          <div className="text-xs text-paper-600 mt-1">
                            {receta.costo.ingredientesSinPrecio.length} sin precio
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium" style={{ color: '#111111', fontWeight: 500 }}>
                          {formatCurrency(receta.costo.costoTotal)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {receta.costo.ingredientesSinPrecio.length > 0 ? (
                        <div className="text-neutral-400 text-sm">
                          {formatCurrency(receta.costo.costoPorPorcion)}
                        </div>
                      ) : (
                        <div className="text-neutral-600">
                          {formatCurrency(receta.costo.costoPorPorcion)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={`/recetas/${receta.id}`}
                          className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/recetas/${receta.id}/editar`}
                          className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
                        >
                          Editar
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

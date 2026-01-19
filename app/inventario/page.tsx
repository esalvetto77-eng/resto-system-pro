'use client'

import { useState, useEffect, useMemo } from 'react'
import { calcularEstadoInventario, formatDateShort, formatCurrency } from '@/lib/utils.ts'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'

interface InventarioItem {
  id: string
  productoId: string
  stockActual: number
  ultimaActualizacion: string
  producto: {
    id: string
    nombre: string
    codigo: string | null
    unidad: string
    stockMinimo: number
    precioCompra: number | null
    rubro: string | null
    proveedor: {
      id: string
      nombre: string
    } | null
  }
}

export default function InventarioPage() {
  const { canEdit } = useAuth()
  const [inventario, setInventario] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [filtroRubro, setFiltroRubro] = useState<string>('')

  useEffect(() => {
    fetchInventario()
  }, [])

  async function fetchInventario() {
    try {
      setLoading(true)
      const response = await fetch('/api/inventario')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al cargar inventario:', response.status, errorData)
        setInventario([])
        return
      }
      
      const data = await response.json()
      console.log('Inventario recibido:', data)
      console.log('Es array?', Array.isArray(data))
      console.log('Cantidad de items:', Array.isArray(data) ? data.length : 0)
      setInventario(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar inventario:', error)
      setInventario([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(id: string, productoId: string) {
    try {
      const response = await fetch(`/api/inventario/${productoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockActual: editValue }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar inventario')
      }

      const data = await response.json()
      console.log('Inventario actualizado:', data)

      await fetchInventario()
      setEditingId(null)
    } catch (error: any) {
      console.error('Error al actualizar inventario:', error)
      alert(error?.message || 'Error al actualizar el stock')
    }
  }

  function startEdit(item: InventarioItem) {
    setEditingId(item.id)
    setEditValue(item.stockActual)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue(0)
  }

  // Obtener rubros únicos del inventario
  const rubrosDisponibles = useMemo(() => {
    const rubros = inventario
      .map((item) => item.producto.rubro)
      .filter((rubro): rubro is string => rubro !== null && rubro !== '')
    return Array.from(new Set(rubros)).sort()
  }, [inventario])

  // Filtrar inventario por rubro
  const inventarioFiltrado = useMemo(() => {
    if (!filtroRubro) return inventario
    return inventario.filter(
      (item) => item.producto.rubro === filtroRubro
    )
  }, [inventario, filtroRubro])

  // Calcular totales y productos en reposición
  const { totalesPorProducto, totalGeneral, productosReposicion } = useMemo(() => {
    let totalGeneral = 0
    const productosReposicion: InventarioItem[] = []
    const totalesPorProducto = inventarioFiltrado.map((item) => {
      const precio = item.producto.precioCompra || 0
      const total = precio * item.stockActual
      totalGeneral += total
      
      if (calcularEstadoInventario(item.stockActual, item.producto.stockMinimo) === 'REPOSICION') {
        productosReposicion.push(item)
      }
      
      return {
        ...item,
        total,
      }
    })
    return { totalesPorProducto, totalGeneral, productosReposicion }
  }, [inventarioFiltrado])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-500">Cargando inventario...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Inventario</h1>
          <p className="text-neutral-600">
            Control de stock y estado del inventario
          </p>
        </div>
        {productosReposicion.length > 0 && (
          <Badge variant="warning" className="text-base px-4 py-2">
            {productosReposicion.length} productos en reposición
          </Badge>
        )}
      </div>

      {/* Resumen y Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Filtros</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <label className="label mb-0">Filtrar por Rubro:</label>
              <select
                className="input flex-1 max-w-xs"
                value={filtroRubro}
                onChange={(e) => setFiltroRubro(e.target.value)}
              >
                <option value="">Todos los rubros</option>
                {rubrosDisponibles.map((rubro) => (
                  <option key={rubro} value={rubro}>
                    {rubro.charAt(0).toUpperCase() + rubro.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-terracotta-50 border-terracotta-200">
          <CardBody className="text-center py-8">
            <div className="text-sm text-terracotta-700 mb-2 font-medium">Total del Inventario</div>
            <ProtectedPrice
              value={totalGeneral}
              formatter={formatCurrency}
              fallback={<span className="text-3xl font-semibold text-neutral-400">-</span>}
              className="text-3xl font-semibold text-terracotta-900"
            />
          </CardBody>
        </Card>
      </div>

      {/* Alerta de Reposición - Minimalista */}
      {productosReposicion.length > 0 && (
        <Card className="border-paper-400 bg-paper-50">
          <CardBody className="py-5">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-paper-900 mb-1">
                  Productos que requieren reposición
                </h3>
                <p className="text-sm text-paper-700">
                  {productosReposicion.length} {productosReposicion.length === 1 ? 'producto' : 'productos'} están por debajo del stock mínimo
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabla de Inventario */}
      {inventarioFiltrado.length === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              No hay productos en el inventario
            </h3>
            <p className="text-neutral-600">
              {filtroRubro
                ? `No hay productos en el rubro "${filtroRubro}"`
                : 'Comienza agregando productos al sistema.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Productos en Inventario
              </h2>
              <div className="text-sm text-neutral-600">
                {inventarioFiltrado.length} {inventarioFiltrado.length === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Producto</TableCell>
                  <TableCell header>Rubro</TableCell>
                  <TableCell header>Proveedor</TableCell>
                  <TableCell header>Stock Actual</TableCell>
                  <TableCell header>Stock Mínimo</TableCell>
                  {canEdit() && <TableCell header>Precio Unit.</TableCell>}
                  {canEdit() && <TableCell header>Total</TableCell>}
                  <TableCell header>Estado</TableCell>
                  <TableCell header>Últ. Actualización</TableCell>
                  {canEdit() && <TableCell header className="text-right">Acciones</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalesPorProducto.map((item) => {
                  const estado = calcularEstadoInventario(
                    item.stockActual,
                    item.producto.stockMinimo
                  )
                  const isEditing = editingId === item.id
                  const necesitaReposicion = estado === 'REPOSICION'

                  return (
                    <TableRow
                      key={item.id}
                      className={necesitaReposicion ? 'bg-paper-50 hover:bg-paper-100' : ''}
                    >
                      <TableCell>
                        <div className="font-medium" style={{ fontWeight: 500, color: '#111111', lineHeight: 1.6 }}>
                          {item.producto.nombre}
                        </div>
                        {item.producto.codigo && (
                          <div className="text-sm text-neutral-500">
                            {item.producto.codigo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.producto.rubro ? (
                          <Badge variant="neutral">
                            {item.producto.rubro.charAt(0).toUpperCase() +
                              item.producto.rubro.slice(1)}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {item.producto.proveedor?.nombre || (
                            <span className="text-neutral-400">Sin proveedor</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="input w-24 text-sm"
                              value={editValue}
                              onChange={(e) =>
                                setEditValue(parseFloat(e.target.value) || 0)
                              }
                              autoFocus
                            />
                            <span className="text-sm text-neutral-600">
                              {item.producto.unidad}
                            </span>
                          </div>
                        ) : (
                          <div className="font-medium" style={{ fontWeight: 500, color: '#111111', lineHeight: 1.6 }}>
                            {item.stockActual.toFixed(2)} {item.producto.unidad}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {item.producto.stockMinimo.toFixed(2)} {item.producto.unidad}
                        </div>
                      </TableCell>
                      {canEdit() && (
                        <TableCell>
                          <ProtectedPrice
                            value={item.producto.precioCompra}
                            formatter={formatCurrency}
                            fallback={<span className="text-neutral-400">-</span>}
                            className="text-neutral-600"
                          />
                        </TableCell>
                      )}
                      {canEdit() && (
                        <TableCell>
                          <ProtectedPrice
                            value={item.total}
                            formatter={formatCurrency}
                            fallback={<span className="text-neutral-400">-</span>}
                            className="font-semibold text-[#111111]"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        {estado === 'OK' ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          <Badge variant="warning">Reposición</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-neutral-600">
                          {formatDateShort(item.ultimaActualizacion)}
                        </div>
                      </TableCell>
                      {canEdit() && (
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() =>
                                  handleSave(item.id, item.productoId)
                                }
                                className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-neutral-600 hover:text-[#111111] font-medium text-sm"
                                style={{ fontWeight: 400, lineHeight: 1.6 }}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                            >
                              Editar
                            </button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// Página de listado de Productos
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, calcularEstadoInventario } from '@/lib/utils'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'

interface Producto {
  id: string
  nombre: string
  codigo: string | null
  unidad: string
  stockMinimo: number
  rubro: string | null
  inventario: { stockActual: number } | null
  proveedores: Array<{
    id: string
    precioCompra: number | null
    moneda: string | null
    precioEnDolares: number | null
    precioEnPesos: number | null
    ordenPreferencia: number
    proveedor: { id: string; nombre: string }
  }>
}

interface Proveedor {
  id: string
  nombre: string
}

export default function ProductosPage() {
  const router = useRouter()
  const { canEdit, canSeePrices, canDelete } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Cargar proveedores
  useEffect(() => {
    async function fetchProveedores() {
      try {
        const response = await fetch('/api/proveedores')
        if (response.ok) {
          const data = await response.json()
          setProveedores(data)
        }
      } catch (error) {
        console.error('Error al cargar proveedores:', error)
      }
    }
    fetchProveedores()
  }, [])

  async function fetchProductos() {
    try {
      setLoading(true)
      const url = proveedorFiltro 
        ? `/api/productos?activo=true&proveedorId=${proveedorFiltro}`
        : '/api/productos?activo=true'
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al cargar productos:', response.status, errorData)
        setProductos([])
        return
      }
      
      const data = await response.json()
      console.log('Productos recibidos:', data)
      console.log('Es array?', Array.isArray(data))
      console.log('Cantidad de productos:', Array.isArray(data) ? data.length : 0)
      
      // Log para debugging de moneda
      if (Array.isArray(data)) {
        data.forEach((producto: any) => {
          producto.proveedores?.forEach((pp: any) => {
            if (pp.moneda === 'USD' || pp.precioEnDolares) {
              console.log('[PRODUCTOS] Producto en USD:', producto.nombre, {
                proveedor: pp.proveedor?.nombre,
                moneda: pp.moneda,
                precioEnDolares: pp.precioEnDolares,
                precioCompra: pp.precioCompra
              })
            }
          })
        })
      }
      
      setProductos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar productos al montar y cuando cambia el filtro
  useEffect(() => {
    fetchProductos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedorFiltro])

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este producto? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar producto')
      }

      // Refrescar la lista
      await fetchProductos()
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar producto:', error)
      alert(error?.message || 'Error al eliminar el producto')
    } finally {
      setDeletingId(null)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Productos</h1>
          <p className="text-neutral-600 mt-1">
            Catálogo de productos y configuración
          </p>
        </div>
        {canEdit() && (
          <Link href="/productos/nuevo">
            <Button>
              + Nuevo Producto
            </Button>
          </Link>
        )}
      </div>

      {/* Filtro de Proveedores */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
          <label htmlFor="proveedor-filtro" className="text-sm font-medium text-neutral-700">
            Filtrar por proveedor:
          </label>
          <select
            id="proveedor-filtro"
            value={proveedorFiltro}
            onChange={(e) => setProveedorFiltro(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 bg-white text-neutral-900"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
          {proveedorFiltro && (
            <button
              onClick={() => setProveedorFiltro('')}
              className="text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        </CardBody>
      </Card>

      {/* Empty State */}
      {productos.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              {proveedorFiltro 
                ? 'No hay productos para este proveedor'
                : 'No hay productos registrados'}
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {proveedorFiltro 
                ? 'Este proveedor no tiene productos asociados o no hay productos activos.'
                : 'Comienza agregando tu primer producto al sistema.'}
            </p>
            {!proveedorFiltro && (
              <Link href="/productos/nuevo">
                <Button size="lg">
                  Crear primer producto
                </Button>
              </Link>
            )}
            {proveedorFiltro && (
              <button
                onClick={() => setProveedorFiltro('')}
                className="text-sm text-terracotta-600 hover:text-terracotta-700 underline"
              >
                Ver todos los productos
              </button>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Table */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Listado de Productos
              </h2>
              <div className="text-sm text-neutral-600">
                {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Producto</TableCell>
                  <TableCell header>Proveedores</TableCell>
                  <TableCell header>Unidad</TableCell>
                  <TableCell header>Stock Actual</TableCell>
                  <TableCell header>Stock Mínimo</TableCell>
                  <TableCell header>Estado</TableCell>
                  {canSeePrices() && <TableCell header>Precios</TableCell>}
                  {canEdit() && <TableCell header className="text-right">Acciones</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => {
                  const stockActual = producto.inventario?.stockActual || 0
                  const estado = calcularEstadoInventario(
                    stockActual,
                    producto.stockMinimo
                  )
                  return (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <div className="font-medium text-neutral-900">
                          {producto.nombre}
                        </div>
                        {producto.codigo && (
                          <div className="text-sm text-neutral-500">
                            {producto.codigo}
                          </div>
                        )}
                        {producto.rubro && (
                          <div className="mt-1">
                            <Badge variant="neutral" className="text-xs">
                              {producto.rubro}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {producto.proveedores.length > 0 ? (
                          <div className="space-y-1">
                            {producto.proveedores.map((pp, idx) => (
                              <div key={pp.id} className="text-sm">
                                <span className="text-neutral-600">
                                  {pp.proveedor.nombre}
                                </span>
                                {pp.ordenPreferencia === 1 && (
                                  <Badge variant="primary" className="ml-2 text-xs">
                                    1°
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-sm">Sin proveedores</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {producto.unidad}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-neutral-900">
                          {stockActual.toFixed(2)} {producto.unidad}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {producto.stockMinimo.toFixed(2)} {producto.unidad}
                        </div>
                      </TableCell>
                      <TableCell>
                        {estado === 'OK' ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          <Badge variant="warning">Reposición</Badge>
                        )}
                      </TableCell>
                      {canSeePrices() && (
                        <TableCell>
                          {producto.proveedores.length > 0 ? (
                            <div className="space-y-1">
                              {producto.proveedores
                                .filter(pp => pp.precioCompra !== null)
                                .sort((a, b) => {
                                  // Ordenar por precio en pesos (precioEnPesos o precioCompra si es UYU)
                                  const precioA = a.precioEnPesos || (a.moneda === 'UYU' ? a.precioCompra : null) || 0
                                  const precioB = b.precioEnPesos || (b.moneda === 'UYU' ? b.precioCompra : null) || 0
                                  return precioA - precioB
                                })
                                .map((pp, idx) => {
                                  const precioEnPesos = pp.precioEnPesos || (pp.moneda === 'UYU' ? pp.precioCompra : null)
                                  const isCheapest = idx === 0 && producto.proveedores.filter(p => p.precioCompra !== null).length > 1
                                  const moneda = pp.moneda || 'UYU'
                                  
                                  return (
                                    <div key={pp.id} className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <div className={isCheapest ? 'font-medium text-terracotta-700' : 'text-neutral-600'}>
                                          {moneda === 'USD' ? (
                                            <>
                                              <ProtectedPrice
                                                value={pp.precioCompra}
                                                formatter={(v) => `$${v?.toFixed(2) || '0.00'}`}
                                                fallback={<span className="text-neutral-400">-</span>}
                                              />
                                              <Badge variant="primary" className="ml-1 text-xs">USD</Badge>
                                              {precioEnPesos && (
                                                <div className="text-xs text-neutral-500 mt-0.5">
                                                  ≈ {formatCurrency(precioEnPesos)} UYU
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <ProtectedPrice
                                                value={pp.precioCompra}
                                                formatter={formatCurrency}
                                                fallback={<span className="text-neutral-400">-</span>}
                                              />
                                              <Badge variant="neutral" className="ml-1 text-xs">UYU</Badge>
                                            </>
                                          )}
                                        </div>
                                        {isCheapest && canSeePrices() && (
                                          <span className="text-xs text-terracotta-600">↓</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              {producto.proveedores.filter(pp => pp.precioCompra === null).length > 0 && (
                                <div className="text-xs text-neutral-400">
                                  {producto.proveedores.filter(pp => pp.precioCompra === null).length} sin precio
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-sm">-</span>
                          )}
                        </TableCell>
                      )}
                      {canEdit() && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <Link
                              href={`/productos/${producto.id}`}
                              className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                            >
                              Ver
                            </Link>
                            <Link
                              href={`/productos/${producto.id}/editar`}
                              className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
                            >
                              Editar
                            </Link>
                            {canDelete() && (
                              <button
                                onClick={() => handleDelete(producto.id)}
                                disabled={deletingId === producto.id}
                                className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                              >
                                {deletingId === producto.id ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            )}
                          </div>
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

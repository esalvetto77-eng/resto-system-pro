// Página para generar pedidos automáticos
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils.ts'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'

interface ProductoReposicion {
  producto: {
    id: string
    nombre: string
    codigo: string | null
    unidad: string
    precioCompra: number | null
  }
  inventario: {
    stockActual: number
  }
  cantidadSugerida: number
}

interface GrupoProveedor {
  proveedor: {
    id: string
    nombre: string
  }
  productos: ProductoReposicion[]
}

export default function NuevoPedidoPage() {
  const router = useRouter()
  const { canSeePrices } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [grupos, setGrupos] = useState<GrupoProveedor[]>([])
  const [cantidades, setCantidades] = useState<
    Record<string, number>
  >({})

  useEffect(() => {
    fetchAutomaticos()
  }, [])

  async function fetchAutomaticos() {
    try {
      const response = await fetch('/api/pedidos/automaticos')
      const data = await response.json()
      setGrupos(data)

      // Inicializar cantidades con valores sugeridos
      const iniciales: Record<string, number> = {}
      data.forEach((grupo: GrupoProveedor) => {
        grupo.productos.forEach((prod) => {
          iniciales[prod.producto.id] = prod.cantidadSugerida
        })
      })
      setCantidades(iniciales)
    } catch (error) {
      console.error('Error al cargar productos en reposición:', error)
      alert('Error al cargar los productos en reposición')
    } finally {
      setLoading(false)
    }
  }

  async function handleCrearPedido(grupo: GrupoProveedor) {
    setSaving(true)

    try {
      const items = grupo.productos.map((prod) => ({
        productoId: prod.producto.id,
        cantidadSugerida: prod.cantidadSugerida,
        cantidadFinal: cantidades[prod.producto.id] || prod.cantidadSugerida,
        precioUnitario: prod.producto.precioCompra,
      }))

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: grupo.proveedor.id,
          estado: 'BORRADOR',
          items,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al crear pedido')
      }

      const data = await response.json()
      console.log('Pedido creado:', data)

      router.push('/pedidos')
      router.refresh()
    } catch (error: any) {
      console.error('Error al crear pedido:', error)
      alert(error?.message || 'Error al crear el pedido')
      setSaving(false)
    }
  }

  function updateCantidad(productoId: string, cantidad: number) {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: cantidad,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando productos...</div>
      </div>
    )
  }

  if (grupos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Generar Pedidos
            </h1>
            <p className="text-neutral-600 mt-1">
              Productos en reposición agrupados por proveedor
            </p>
          </div>
          <Link href="/pedidos" className="btn btn-ghost">
            Volver
          </Link>
        </div>

        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">
              No hay productos en reposición
            </p>
            <Link href="/inventario" className="btn btn-primary">
              Ver Inventario
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Generar Pedidos
          </h1>
          <p className="text-neutral-600 mt-1">
            Productos en reposición agrupados por proveedor
          </p>
        </div>
        <Link href="/pedidos" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <div className="space-y-6">
        {grupos.map((grupo) => (
          <div key={grupo.proveedor.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {grupo.proveedor.nombre}
                </h2>
                <button
                  onClick={() => handleCrearPedido(grupo)}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Creando...' : 'Crear Pedido'}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Stock Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Cantidad Sugerida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Cantidad Final
                      </th>
                        {canSeePrices() && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Precio
                          </th>
                        )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {grupo.productos.map((prod) => {
                      const cantidadFinal =
                        cantidades[prod.producto.id] || prod.cantidadSugerida
                      return (
                        <tr key={prod.producto.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {prod.producto.nombre}
                            </div>
                            {prod.producto.codigo && (
                              <div className="text-sm text-neutral-500">
                                {prod.producto.codigo}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-600">
                              {prod.inventario.stockActual.toFixed(2)}{' '}
                              {prod.producto.unidad}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-600">
                              {prod.cantidadSugerida.toFixed(2)}{' '}
                              {prod.producto.unidad}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="input w-32"
                              value={cantidadFinal}
                              onChange={(e) =>
                                updateCantidad(
                                  prod.producto.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <span className="ml-2 text-sm text-neutral-600">
                              {prod.producto.unidad}
                            </span>
                          </td>
                          {canSeePrices() && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ProtectedPrice
                                value={prod.producto.precioCompra}
                                formatter={formatCurrency}
                                fallback={<span className="text-sm text-neutral-400">-</span>}
                                className="text-sm text-neutral-600"
                              />
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

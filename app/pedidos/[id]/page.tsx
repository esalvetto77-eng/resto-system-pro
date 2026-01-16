// Página de detalle de Pedido
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'

interface ItemPedido {
  id: string
  cantidadSugerida: number
  cantidadFinal: number
  precioUnitario: number | null
  producto: {
    id: string
    nombre: string
    codigo: string | null
    unidad: string
  }
}

interface Pedido {
  id: string
  fechaCreacion: string
  fechaPedido: string | null
  fechaEntrega: string | null
  estado: string
  observaciones: string | null
  proveedor: {
    id: string
    nombre: string
  }
  items: ItemPedido[]
}

export default function PedidoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { canSeePrices } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    fetchPedido()
  }, [params.id])

  async function fetchPedido() {
    try {
      const response = await fetch(`/api/pedidos/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar pedido')
      const data = await response.json()
      setPedido(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'BORRADOR':
        return <span className="badge badge-neutral">Borrador</span>
      case 'ENVIADO':
        return <span className="badge badge-warning">Enviado</span>
      case 'RECIBIDO':
        return <span className="badge badge-success">Recibido</span>
      case 'CANCELADO':
        return <span className="badge badge-danger">Cancelado</span>
      default:
        return <span className="badge badge-neutral">{estado}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando pedido...</div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-neutral-600 mb-4">Pedido no encontrado</p>
          <Link href="/pedidos" className="btn btn-primary">
            Volver a Pedidos
          </Link>
        </div>
      </div>
    )
  }

  const totalItems = pedido.items.length
  const totalEstimado = pedido.items.reduce((sum, item) => {
    const precio = item.precioUnitario || 0
    return sum + item.cantidadFinal * precio
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Pedido a {pedido.proveedor.nombre}
          </h1>
          <p className="text-neutral-600 mt-1">Detalle del pedido</p>
        </div>
        <Link href="/pedidos" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Información del Pedido
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Estado
                  </div>
                  <div className="mt-1">{getEstadoBadge(pedido.estado)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Proveedor
                  </div>
                  <div className="mt-1 text-base text-neutral-900">
                    {pedido.proveedor.nombre}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Fecha Creación
                  </div>
                  <div className="mt-1 text-base text-neutral-900">
                    {formatDateShort(pedido.fechaCreacion)}
                  </div>
                </div>
                {pedido.fechaPedido && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Fecha Pedido
                    </div>
                    <div className="mt-1 text-base text-neutral-900">
                      {formatDateShort(pedido.fechaPedido)}
                    </div>
                  </div>
                )}
                {pedido.fechaEntrega && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Fecha Entrega
                    </div>
                    <div className="mt-1 text-base text-neutral-900">
                      {formatDateShort(pedido.fechaEntrega)}
                    </div>
                  </div>
                )}
              </div>
              {pedido.observaciones && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Observaciones
                  </div>
                  <div className="mt-1 text-base text-neutral-900">
                    {pedido.observaciones}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Productos ({totalItems})
              </h2>
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
                        Cantidad
                      </th>
                      {canSeePrices() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Precio Unitario
                        </th>
                      )}
                      {canSeePrices() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {pedido.items.map((item) => {
                      const subtotal =
                        (item.precioUnitario || 0) * item.cantidadFinal
                      return (
                        <tr key={item.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {item.producto.nombre}
                            </div>
                            {item.producto.codigo && (
                              <div className="text-sm text-neutral-500">
                                {item.producto.codigo}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-600">
                              {item.cantidadFinal.toFixed(2)}{' '}
                              {item.producto.unidad}
                            </div>
                            {item.cantidadFinal !== item.cantidadSugerida && (
                              <div className="text-xs text-neutral-500">
                                Sugerido: {item.cantidadSugerida.toFixed(2)}
                              </div>
                            )}
                          </td>
                          {canSeePrices() && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ProtectedPrice
                                value={item.precioUnitario}
                                formatter={formatCurrency}
                                fallback={<span className="text-sm text-neutral-400">-</span>}
                                className="text-sm text-neutral-600"
                              />
                            </td>
                          )}
                          {canSeePrices() && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <ProtectedPrice
                                value={subtotal}
                                formatter={formatCurrency}
                                fallback={<span className="text-sm text-neutral-400">-</span>}
                                className="text-sm font-medium text-neutral-900"
                              />
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                  {totalEstimado > 0 && canSeePrices() && (
                    <tfoot className="bg-neutral-50">
                      <tr>
                        <td
                          colSpan={canSeePrices() ? 3 : 2}
                          className="px-6 py-4 text-right text-sm font-medium text-neutral-900"
                        >
                          Total Estimado:
                        </td>
                        {canSeePrices() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                            {formatCurrency(totalEstimado)}
                          </td>
                        )}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Resumen
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-sm font-medium text-neutral-500">
                  Total de Items
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {totalItems}
                </div>
              </div>
              {totalEstimado > 0 && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Total Estimado
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(totalEstimado)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Página de listado de Pedidos
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDateShort, formatCurrency } from '@/lib/utils.ts'

interface ItemPedido {
  id: string
  cantidadSugerida: number
  cantidadFinal: number
  precioUnitario: number | null
  producto: {
    id: string
    nombre: string
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

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPedidos()
  }, [])

  async function fetchPedidos() {
    try {
      setLoading(true)
      const response = await fetch('/api/pedidos')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al cargar pedidos:', response.status, errorData)
        setPedidos([])
        return
      }
      
      const data = await response.json()
      setPedidos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
      setPedidos([])
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
        <div className="text-neutral-600">Cargando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Pedidos</h1>
          <p className="text-neutral-600 mt-1">
            Gestión de pedidos a proveedores
          </p>
        </div>
        <Link href="/pedidos/nuevo" className="btn btn-primary">
          + Generar Pedidos Automáticos
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-neutral-600 mb-4">No hay pedidos registrados</p>
            <Link href="/pedidos/nuevo" className="btn btn-primary">
              Generar primer pedido
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const totalItems = pedido.items.length
            const totalCantidad = pedido.items.reduce(
              (sum, item) => sum + item.cantidadFinal,
              0
            )
            return (
              <div key={pedido.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {pedido.proveedor.nombre}
                        </h3>
                        {getEstadoBadge(pedido.estado)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Fecha Creación:</span>{' '}
                          {formatDateShort(pedido.fechaCreacion)}
                        </div>
                        {pedido.fechaPedido && (
                          <div>
                            <span className="font-medium">Fecha Pedido:</span>{' '}
                            {formatDateShort(pedido.fechaPedido)}
                          </div>
                        )}
                        {pedido.fechaEntrega && (
                          <div>
                            <span className="font-medium">Fecha Entrega:</span>{' '}
                            {formatDateShort(pedido.fechaEntrega)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Items:</span> {totalItems} productos
                        </div>
                      </div>
                      {pedido.observaciones && (
                        <div className="mt-2 text-sm text-neutral-600">
                          <span className="font-medium">Observaciones:</span>{' '}
                          {pedido.observaciones}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Link
                        href={`/pedidos/${pedido.id}`}
                        className="btn btn-ghost"
                      >
                        Ver Detalle
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

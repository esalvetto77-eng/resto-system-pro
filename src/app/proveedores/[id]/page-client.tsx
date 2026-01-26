'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseJSON, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface ProveedorDetailClientProps {
  proveedor: {
    id: string
    nombre: string
    contacto: string | null
    telefono: string | null
    email: string | null
    direccion: string | null
    diasPedido: string | null
    diasEntrega: string | null
    horarioPedido: string | null
    activo: boolean
    rubro: string | null
    minimoCompra: number | null
    metodoPago: string | null
    comentario: string | null
    numeroCuenta: string | null
    banco: string | null
    productos: Array<{
      id: string
      precioCompra: number | null
      producto: {
        id: string
        nombre: string
        codigo: string | null
        unidad: string
        stockMinimo: number
      }
    }>
  }
}

export function ProveedorDetailPageClient({ proveedor }: ProveedorDetailClientProps) {
  const router = useRouter()
  const { canEdit, canDelete } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const diasPedido = parseJSON<string[]>(proveedor.diasPedido, [])
  const diasEntrega = parseJSON<string[]>(proveedor.diasEntrega, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {proveedor.nombre}
          </h1>
          <p className="text-neutral-600 mt-1">Detalle del proveedor</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/proveedores" className="btn btn-ghost">
            Volver
          </Link>
          {canEdit() && (
            <Link
              href={`/proveedores/${proveedor.id}/editar`}
              className="btn btn-primary"
            >
              Editar
            </Link>
          )}
          {canDelete() && (
            <button
              onClick={async () => {
                if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este proveedor? Esta acción no se puede deshacer.')) {
                  return
                }
                setDeleting(true)
                try {
                  const response = await fetch(`/api/proveedores/${proveedor.id}`, {
                    method: 'DELETE',
                  })
                  if (!response.ok) throw new Error('Error al eliminar proveedor')
                  router.push('/proveedores')
                  router.refresh()
                } catch (error: any) {
                  alert(error?.message || 'Error al eliminar el proveedor')
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
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Información de Contacto
              </h2>
            </div>
            <div className="card-body space-y-4">
              {proveedor.contacto && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Contacto
                  </div>
                  <div className="text-base text-neutral-900">
                    {proveedor.contacto}
                  </div>
                </div>
              )}
              {proveedor.telefono && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Teléfono
                  </div>
                  <div className="text-base text-neutral-900">
                    {proveedor.telefono}
                  </div>
                </div>
              )}
              {proveedor.email && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Email
                  </div>
                  <div className="text-base text-neutral-900">
                    {proveedor.email}
                  </div>
                </div>
              )}
              {proveedor.direccion && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Dirección
                  </div>
                  <div className="text-base text-neutral-900">
                    {proveedor.direccion}
                  </div>
                </div>
              )}
              {proveedor.comentario && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Comentario
                  </div>
                  <div className="text-base text-neutral-900 whitespace-pre-wrap">
                    {proveedor.comentario}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(proveedor.numeroCuenta || proveedor.banco) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Datos de Pago
                </h2>
              </div>
              <div className="card-body space-y-4">
                {proveedor.numeroCuenta && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Número de Cuenta
                    </div>
                    <div className="text-base text-neutral-900">
                      {proveedor.numeroCuenta}
                    </div>
                  </div>
                )}
                {proveedor.banco && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Banco
                    </div>
                    <div className="text-base text-neutral-900">
                      {proveedor.banco}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Configuración de Pedidos
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-2">
                  Días de Pedido
                </div>
                <div className="flex flex-wrap gap-2">
                  {diasPedido.length > 0 ? (
                    diasPedido.map((dia) => (
                      <span
                        key={dia}
                        className="badge badge-neutral"
                      >
                        {dia}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500">No configurado</span>
                  )}
                </div>
              </div>
              {proveedor.horarioPedido && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Horario de Pedido
                  </div>
                  <div className="text-base text-neutral-900">
                    {proveedor.horarioPedido}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-2">
                  Días de Entrega
                </div>
                <div className="flex flex-wrap gap-2">
                  {diasEntrega.length > 0 ? (
                    diasEntrega.map((dia) => (
                      <span key={dia} className="badge badge-neutral">
                        {dia}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500">No configurado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Estado
              </h2>
            </div>
            <div className="card-body">
              {proveedor.activo ? (
                <span className="badge badge-success">Activo</span>
              ) : (
                <span className="badge badge-neutral">Inactivo</span>
              )}
            </div>
          </div>

          {(proveedor.rubro || proveedor.minimoCompra || proveedor.metodoPago) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Información Adicional
                </h2>
              </div>
              <div className="card-body space-y-4">
                {proveedor.rubro && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Rubro
                    </div>
                    <div className="text-base text-neutral-900">
                      {proveedor.rubro.charAt(0).toUpperCase() +
                        proveedor.rubro.slice(1)}
                    </div>
                  </div>
                )}
                {proveedor.minimoCompra && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Mínimo de Compra
                    </div>
                    <div className="text-base text-neutral-900">
                      {formatCurrency(proveedor.minimoCompra)}
                    </div>
                  </div>
                )}
                {proveedor.metodoPago && (
                  <div>
                    <div className="text-sm font-medium text-neutral-500">
                      Método de Pago
                    </div>
                    <div className="text-base text-neutral-900">
                      {proveedor.metodoPago}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {proveedor.productos.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Productos ({proveedor.productos.length})
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  {proveedor.productos.slice(0, 5).map((productoProveedor) => (
                    <div
                      key={productoProveedor.id}
                      className="text-sm text-neutral-700 py-1"
                    >
                      {productoProveedor.producto.nombre}
                    </div>
                  ))}
                  {proveedor.productos.length > 5 && (
                    <div className="text-sm text-neutral-500 pt-2">
                      +{proveedor.productos.length - 5} más
                    </div>
                  )}
                </div>
                <Link
                  href="/productos"
                  className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-block"
                >
                  Ver todos los productos →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, calcularEstadoInventario } from '@/lib/utils.ts'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProtectedPrice } from '@/components/ui/ProtectedPrice'
import { useAuth } from '@/contexts/AuthContext'

interface ProductoDetailClientProps {
  producto: {
    id: string
    nombre: string
    codigo: string | null
    descripcion: string | null
    unidad: string
    stockMinimo: number
    rubro: string | null
    activo: boolean
    proveedores: Array<{
      id: string
      precioCompra: number | null
      ordenPreferencia: number
      proveedor: {
        id: string
        nombre: string
        contacto: string | null
        telefono: string | null
      }
    }>
    inventario: {
      id: string
      stockActual: number
      ultimaActualizacion: string
    } | null
  }
}

export function ProductoDetailPageClient({ producto }: ProductoDetailClientProps) {
  const router = useRouter()
  const { canEdit, canDelete, canSeePrices } = useAuth()
  const [deleting, setDeleting] = useState(false)

  const stockActual = producto.inventario?.stockActual || 0
  const estado = calcularEstadoInventario(stockActual, producto.stockMinimo)
  
  // Ordenar proveedores por precio (menor a mayor)
  const proveedoresOrdenados = [...producto.proveedores].sort((a, b) => {
    const precioA = a.precioCompra || Infinity
    const precioB = b.precioCompra || Infinity
    return precioA - precioB
  })
  const precioMasBajo = proveedoresOrdenados.find(p => p.precioCompra !== null)?.precioCompra

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            {producto.nombre}
          </h1>
          <p className="text-neutral-600 mt-1">Detalle del producto</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/productos">
            <Button variant="ghost">Volver</Button>
          </Link>
          {canEdit() && (
            <Link href={`/productos/${producto.id}/editar`}>
              <Button>Editar</Button>
            </Link>
          )}
          {canDelete() && (
            <button
              onClick={async () => {
                if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este producto? Esta acción no se puede deshacer.')) {
                  return
                }
                setDeleting(true)
                try {
                  const response = await fetch(`/api/productos/${producto.id}`, {
                    method: 'DELETE',
                  })
                  if (!response.ok) throw new Error('Error al eliminar producto')
                  router.push('/productos')
                  router.refresh()
                } catch (error: any) {
                  alert(error?.message || 'Error al eliminar el producto')
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
                Información del Producto
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {producto.codigo && (
                <div>
                  <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                    Código
                  </div>
                  <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                    {producto.codigo}
                  </div>
                </div>
              )}
              {producto.descripcion && (
                <div>
                  <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                    Descripción
                  </div>
                  <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                    {producto.descripcion}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                  Unidad
                </div>
                <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                  {producto.unidad}
                </div>
              </div>
              {producto.rubro && (
                <div>
                  <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                    Rubro
                  </div>
                  <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                    {producto.rubro.charAt(0).toUpperCase() + producto.rubro.slice(1)}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Inventario */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Inventario
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                  Stock Actual
                </div>
                <div className="text-2xl font-semibold" style={{ color: '#111111', lineHeight: 1.5 }}>
                  {stockActual.toFixed(2)} {producto.unidad}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                  Stock Mínimo
                </div>
                <div className="text-base" style={{ color: '#111111', lineHeight: 1.6 }}>
                  {producto.stockMinimo.toFixed(2)} {producto.unidad}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                  Estado
                </div>
                <div>
                  {estado === 'OK' ? (
                    <Badge variant="success">OK</Badge>
                  ) : (
                    <Badge variant="warning">Requiere Reposición</Badge>
                  )}
                </div>
              </div>
              {producto.inventario && (
                <div>
                  <div className="text-sm font-medium text-neutral-500" style={{ fontWeight: 500 }}>
                    Última Actualización
                  </div>
                  <div className="text-base text-neutral-600" style={{ lineHeight: 1.6 }}>
                    {new Date(producto.inventario.ultimaActualizacion).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Proveedores */}
          {producto.proveedores.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                  Proveedores ({producto.proveedores.length})
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {proveedoresOrdenados.map((pp) => (
                    <div
                      key={pp.id}
                      className="flex items-center justify-between border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: '#111111', lineHeight: 1.6 }}>
                          {pp.proveedor.nombre}
                          {pp.ordenPreferencia === 1 && (
                            <Badge variant="primary" className="ml-2">
                              1° Preferencia
                            </Badge>
                          )}
                        </div>
                        {(pp.proveedor.contacto || pp.proveedor.telefono) && (
                          <div className="text-sm text-neutral-600 mt-1">
                            {pp.proveedor.contacto && <span>{pp.proveedor.contacto}</span>}
                            {pp.proveedor.contacto && pp.proveedor.telefono && <span> • </span>}
                            {pp.proveedor.telefono && <span>{pp.proveedor.telefono}</span>}
                          </div>
                        )}
                      </div>
                      {canSeePrices() && (
                        <div className="ml-4">
                          <ProtectedPrice
                            value={pp.precioCompra}
                            formatter={formatCurrency}
                            fallback={<span className="text-neutral-400">-</span>}
                            className="font-semibold"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {canSeePrices() && precioMasBajo && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="text-sm font-medium text-neutral-500">
                      Precio más bajo
                    </div>
                    <div className="text-xl font-semibold text-terracotta-700">
                      {formatCurrency(precioMasBajo)}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Estado
              </h2>
            </CardHeader>
            <CardBody>
              {producto.activo ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="neutral">Inactivo</Badge>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Link href="/inventario" className="text-terracotta-600 hover:text-terracotta-700 font-medium">
                Ver en Inventario →
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

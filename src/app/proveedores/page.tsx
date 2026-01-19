'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseJSON } from '@/lib/utils'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { useAuth } from '@/contexts/AuthContext'

interface Proveedor {
  id: string
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  diasPedido: string | null
  horarioPedido: string | null
  activo: boolean
  rubro: string | null
  minimoCompra: number | null
  metodoPago: string | null
}

export default function ProveedoresPage() {
  const router = useRouter()
  const { canEdit, canDelete } = useAuth()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProveedores()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este proveedor? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/proveedores/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar proveedor')
      }

      // Refrescar la lista
      await fetchProveedores()
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar proveedor:', error)
      alert(error?.message || 'Error al eliminar el proveedor')
    } finally {
      setDeletingId(null)
    }
  }

  async function fetchProveedores() {
    try {
      setLoading(true)
      const response = await fetch('/api/proveedores')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al cargar proveedores:', response.status, errorData)
        setProveedores([])
        return
      }
      
      const data = await response.json()
      console.log('Proveedores recibidos:', data)
      console.log('Es array?', Array.isArray(data))
      console.log('Cantidad de proveedores:', Array.isArray(data) ? data.length : 0)
      setProveedores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-500">Cargando proveedores...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Proveedores</h1>
          <p className="text-neutral-600 mt-1">
            Gestión de proveedores y configuración de pedidos
          </p>
        </div>
        {canEdit() && (
          <Link href="/proveedores/nuevo">
            <Button>
              + Nuevo Proveedor
            </Button>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {proveedores.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              No hay proveedores registrados
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Comienza agregando tu primer proveedor al sistema.
            </p>
            {canEdit() && (
              <Link href="/proveedores/nuevo">
                <Button size="lg">
                  Crear primer proveedor
                </Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ) : (
        /* Table */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Listado de Proveedores
              </h2>
              <div className="text-sm text-neutral-600">
                {proveedores.length} {proveedores.length === 1 ? 'proveedor' : 'proveedores'}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Nombre</TableCell>
                  <TableCell header>Contacto</TableCell>
                  <TableCell header>Rubro</TableCell>
                  <TableCell header>Días de Pedido</TableCell>
                  <TableCell header>Método de Pago</TableCell>
                  <TableCell header>Estado</TableCell>
                  {canEdit() && <TableCell header className="text-right">Acciones</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => {
                  const diasPedido = parseJSON<string[]>(
                    proveedor.diasPedido,
                    []
                  )
                  return (
                    <TableRow key={proveedor.id}>
                      <TableCell>
                        <div className="font-medium text-neutral-900">
                          {proveedor.nombre}
                        </div>
                        {proveedor.direccion && (
                          <div className="text-sm text-neutral-500 mt-1">
                            {proveedor.direccion}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {proveedor.contacto || '-'}
                        </div>
                        {proveedor.telefono && (
                          <div className="text-sm text-neutral-500">
                            {proveedor.telefono}
                          </div>
                        )}
                        {proveedor.email && (
                          <div className="text-sm text-neutral-500">
                            {proveedor.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {proveedor.rubro ? (
                          <Badge variant="neutral">
                            {proveedor.rubro}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-neutral-600">
                          {diasPedido.length > 0 ? diasPedido.join(', ') : '-'}
                        </div>
                        {proveedor.horarioPedido && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {proveedor.horarioPedido}
                          </div>
                        )}
                        {proveedor.minimoCompra && (
                          <div className="text-xs text-neutral-500 mt-1">
                            Mín: ${proveedor.minimoCompra.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {proveedor.metodoPago ? (
                          <div className="text-neutral-600 text-sm">
                            {proveedor.metodoPago}
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {proveedor.activo ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="neutral">Inactivo</Badge>
                        )}
                      </TableCell>
                      {canEdit() && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <Link
                              href={`/proveedores/${proveedor.id}`}
                              className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                            >
                              Ver
                            </Link>
                            <Link
                              href={`/proveedores/${proveedor.id}/editar`}
                              className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
                            >
                              Editar
                            </Link>
                            {canDelete() && (
                              <button
                                onClick={() => handleDelete(proveedor.id)}
                                disabled={deletingId === proveedor.id}
                                className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                              >
                                {deletingId === proveedor.id ? 'Eliminando...' : 'Eliminar'}
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

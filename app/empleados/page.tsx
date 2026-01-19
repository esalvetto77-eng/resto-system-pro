'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateShort } from '@/lib/utils.ts'
import { useRestaurante } from '@/contexts/RestauranteContext.tsx'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { AdminOnly } from '@/components/guards/AdminOnly'

interface Empleado {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string | null
  email: string | null
  tipoSueldo: string
  sueldo: number | null
  fechaIngreso: string
  activo: boolean
  restaurantes: Array<{
    restaurante: {
      id: string
      nombre: string
    }
  }>
}

export default function EmpleadosPage() {
  const router = useRouter()
  const { restauranteActivo } = useRestaurante()
  const { canDelete } = useAuth()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmpleados() {
      try {
        setLoading(true)
        const url = restauranteActivo
          ? `/api/empleados?restauranteId=${restauranteActivo.id}`
          : '/api/empleados'
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error al cargar empleados:', response.status, errorData)
          setEmpleados([])
          return
        }
        
        const data = await response.json()
        console.log('Empleados recibidos:', data)
        console.log('Es array?', Array.isArray(data))
        console.log('Cantidad de empleados:', Array.isArray(data) ? data.length : 0)
        setEmpleados(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar empleados:', error)
        setEmpleados([])
      } finally {
        setLoading(false)
      }
    }
    fetchEmpleados()
  }, [restauranteActivo?.id])

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este empleado? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/empleados/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al eliminar empleado')
      }

      // Refrescar la lista
      await fetchEmpleados()
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar empleado:', error)
      alert(error?.message || 'Error al eliminar el empleado')
    } finally {
      setDeletingId(null)
    }
  }

  async function fetchEmpleados() {
    try {
      setLoading(true)
      const url = restauranteActivo
        ? `/api/empleados?restauranteId=${restauranteActivo.id}`
        : '/api/empleados'
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al cargar empleados:', response.status, errorData)
        setEmpleados([])
        return
      }
      
      const data = await response.json()
      console.log('Empleados recibidos:', data)
      console.log('Es array?', Array.isArray(data))
      console.log('Cantidad de empleados:', Array.isArray(data) ? data.length : 0)
      setEmpleados(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
      setEmpleados([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-500">Cargando empleados...</div>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Empleados</h1>
          <p className="text-neutral-600 mt-1">
            Gestión completa de empleados y personal
            {restauranteActivo && (
              <Badge variant="primary" className="ml-2">
                {restauranteActivo.nombre}
              </Badge>
            )}
          </p>
        </div>
        <Link href="/empleados/nuevo">
          <Button>
            + Nuevo Empleado
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {!Array.isArray(empleados) || empleados.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <h3 className="text-xl font-semibold text-[#111111] mb-2" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              No hay empleados registrados
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {restauranteActivo
                ? `No hay empleados asignados a "${restauranteActivo.nombre}". Comienza agregando tu primer empleado.`
                : 'Comienza agregando tu primer empleado al sistema.'}
            </p>
            <Link href="/empleados/nuevo">
              <Button size="lg">
                Crear primer empleado
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        /* Table */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Listado de Empleados
              </h2>
              <div className="text-sm text-neutral-600">
                {empleados.length} {empleados.length === 1 ? 'empleado' : 'empleados'}
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Empleado</TableCell>
                  <TableCell header>DNI</TableCell>
                  <TableCell header>Contacto</TableCell>
                  <TableCell header>Tipo de Sueldo</TableCell>
                  <TableCell header>Sueldo</TableCell>
                  <TableCell header>Fecha Ingreso</TableCell>
                  <TableCell header>Estado</TableCell>
                  <TableCell header className="text-right">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell>
                      <div className="font-medium text-neutral-900">
                        {empleado.nombre} {empleado.apellido}
                      </div>
                      {!restauranteActivo && empleado.restaurantes.length > 0 && (
                        <div className="text-xs text-neutral-500 mt-1">
                          {empleado.restaurantes
                            .map((r) => r.restaurante.nombre)
                            .join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {empleado.dni || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {empleado.telefono || '-'}
                      </div>
                      {empleado.email && (
                        <div className="text-sm text-neutral-500">
                          {empleado.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {empleado.tipoSueldo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-neutral-900">
                        {empleado.sueldo
                          ? formatCurrency(empleado.sueldo)
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-neutral-600">
                        {formatDateShort(new Date(empleado.fechaIngreso))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {empleado.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="neutral">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={`/empleados/${empleado.id}`}
                          className="text-terracotta-600 hover:text-terracotta-700 font-medium text-sm"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/empleados/${empleado.id}/editar`}
                          className="text-neutral-600 hover:text-neutral-900 font-medium text-sm"
                        >
                          Editar
                        </Link>
                        {canDelete() && (
                          <button
                            onClick={() => handleDelete(empleado.id)}
                            disabled={deletingId === empleado.id}
                            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                          >
                            {deletingId === empleado.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        )}
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
    </AdminOnly>
  )
}

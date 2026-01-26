'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseJSON } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const RUBROS = [
  'secos',
  'pescados',
  'bebidas',
  'limpieza',
  'descartables',
  'carnes',
  'verduras',
  'otros',
]

export default function EditarProveedorPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    rubro: '',
    minimoCompra: 0,
    metodoPago: '',
    comentario: '',
    numeroCuenta: '',
    banco: '',
    diasPedido: [] as string[],
    horarioPedido: '',
    diasEntrega: [] as string[],
    activo: true,
  })

  useEffect(() => {
    async function fetchProveedor() {
      try {
        const response = await fetch(`/api/proveedores/${params.id}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(errorData.error || 'Error al cargar proveedor')
        }
        const data = await response.json()
        
        if (!data || !data.id) {
          throw new Error('Datos del proveedor inválidos')
        }
        
        setFormData({
          nombre: data.nombre || '',
          contacto: data.contacto || '',
          telefono: data.telefono || '',
          email: data.email || '',
          direccion: data.direccion || '',
          rubro: data.rubro || '',
          minimoCompra: data.minimoCompra || 0,
          metodoPago: data.metodoPago || '',
          comentario: data.comentario || '',
          numeroCuenta: data.numeroCuenta || '',
          banco: data.banco || '',
          diasPedido: parseJSON<string[]>(data.diasPedido, []),
          horarioPedido: data.horarioPedido || '',
          diasEntrega: parseJSON<string[]>(data.diasEntrega, []),
          activo: data.activo ?? true,
        })
      } catch (error: any) {
        console.error('Error al cargar proveedor:', error)
        alert(error?.message || 'Error al cargar el proveedor')
        router.push('/proveedores')
      } finally {
        setLoading(false)
      }
    }
    fetchProveedor()
  }, [params.id, router])

  const handleDiaChange = (
    dia: string,
    field: 'diasPedido' | 'diasEntrega'
  ) => {
    setFormData((prev) => {
      const dias = prev[field]
      const newDias = dias.includes(dia)
        ? dias.filter((d) => d !== dia)
        : [...dias, dia]
      return { ...prev, [field]: newDias }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit()) return // Prevent submission if not authorized
    setSaving(true)

    try {
      const response = await fetch(`/api/proveedores/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          diasPedido: JSON.stringify(formData.diasPedido),
          diasEntrega: JSON.stringify(formData.diasEntrega),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al actualizar proveedor')
      }

      const data = await response.json()
      console.log('Proveedor actualizado:', data)
      
      router.push(`/proveedores/${params.id}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error al actualizar proveedor:', error)
      alert(error?.message || 'Error al actualizar el proveedor')
      setSaving(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Editar Proveedor
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar información del proveedor
          </p>
        </div>
        <Link href={`/proveedores/${params.id}`} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Datos Básicos */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Datos Básicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Contacto</label>
                <input
                  type="text"
                  className="input"
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  className="input"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Dirección</label>
                <input
                  type="text"
                  className="input"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Rubro</label>
                <input
                  type="text"
                  className="input"
                  value={formData.rubro}
                  onChange={(e) =>
                    setFormData({ ...formData, rubro: e.target.value })
                  }
                  placeholder="Ej: secos, pescados, bebidas, limpieza, descartables, carnes, verduras, etc."
                />
              </div>
              <div>
                <label className="label">Mínimo de Compra</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={formData.minimoCompra}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimoCompra: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Método de Pago</label>
                <input
                  type="text"
                  className="input"
                  value={formData.metodoPago}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metodoPago: e.target.value,
                    })
                  }
                  placeholder="Ej: Crédito a 30 días, Transferencia, Efectivo, A factura vencida, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Comentario</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.comentario}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comentario: e.target.value,
                    })
                  }
                  placeholder="Ej: Número para pedidos: 099123456, Horario especial: Lunes a Viernes 8-18hs, etc."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Información adicional como número para pedidos, horarios especiales, etc.
                </p>
              </div>
            </div>
          </div>

          {/* Datos de Pago */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Datos de Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Número de Cuenta</label>
                <input
                  type="text"
                  className="input"
                  value={formData.numeroCuenta}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroCuenta: e.target.value,
                    })
                  }
                  placeholder="Ej: 001234567890"
                />
              </div>
              <div>
                <label className="label">Banco</label>
                <input
                  type="text"
                  className="input"
                  value={formData.banco}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      banco: e.target.value,
                    })
                  }
                  placeholder="Ej: BROU, Santander, Itaú, etc."
                />
              </div>
            </div>
          </div>

          {/* Configuración de Pedidos */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Configuración de Pedidos
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Días de Pedido *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <label
                      key={dia}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.diasPedido.includes(dia)}
                        onChange={() => handleDiaChange(dia, 'diasPedido')}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{dia}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Horario de Pedido</label>
                <input
                  type="text"
                  placeholder="Ej: 09:00-12:00"
                  className="input"
                  value={formData.horarioPedido}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      horarioPedido: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="label">Días de Entrega *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <label
                      key={dia}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.diasEntrega.includes(dia)}
                        onChange={() => handleDiaChange(dia, 'diasEntrega')}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{dia}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) =>
                  setFormData({ ...formData, activo: e.target.checked })
                }
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Proveedor activo
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link
              href={`/proveedores/${params.id}`}
              className="btn btn-ghost"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

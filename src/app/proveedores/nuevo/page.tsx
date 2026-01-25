'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function NuevoProveedorPage() {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(false)

  // Solo ADMIN puede crear proveedores
  useEffect(() => {
    if (!canEdit()) {
      router.push('/proveedores')
    }
  }, [canEdit, router])
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
    diasPedido: [] as string[],
    horarioPedido: '',
    diasEntrega: [] as string[],
    activo: true,
  })

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
    setLoading(true)

    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          diasPedido: JSON.stringify(formData.diasPedido),
          diasEntrega: JSON.stringify(formData.diasEntrega),
        }),
      })

      if (!response.ok) throw new Error('Error al crear proveedor')

      router.push('/proveedores')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el proveedor')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Nuevo Proveedor
          </h1>
          <p className="text-neutral-600 mt-1">
            Agregar un nuevo proveedor al sistema
          </p>
        </div>
        <Link href="/proveedores" className="btn btn-ghost">
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
            <Link href="/proveedores" className="btn btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Guardando...' : 'Crear Proveedor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

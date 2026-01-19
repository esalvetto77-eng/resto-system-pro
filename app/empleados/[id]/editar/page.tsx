'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseJSON } from '@/lib/utils.ts'
import { useAuth } from '@/contexts/AuthContext'

const TIPOS_SUELDO = ['MENSUAL', 'JORNAL']
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function EditarEmpleadoPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Solo ADMIN puede editar empleados
  useEffect(() => {
    if (!canEdit()) {
      router.push(`/empleados/${params.id}`)
    }
  }, [canEdit, router, params.id])
  const [diasDescanso, setDiasDescanso] = useState<Record<string, 'completo' | 'medio-mañana' | 'medio-tarde' | null>>({
    Lunes: null,
    Martes: null,
    Miércoles: null,
    Jueves: null,
    Viernes: null,
    Sábado: null,
    Domingo: null,
  })
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoSueldo: 'MENSUAL',
    sueldo: 0,
    valorHoraExtra: 0,
    fechaIngreso: '',
    fechaBaja: '',
    activo: true,
    horarioEntrada: '',
    horarioSalida: '',
    carnetManipulacionEmision: '',
    carnetManipulacionVencimiento: '',
    carnetSaludEmision: '',
    carnetSaludVencimiento: '',
    cuentaBancaria: '',
    nombreBanco: '',
  })
  const [restaurantesSeleccionados, setRestaurantesSeleccionados] = useState<string[]>([])
  const [restaurantesDisponibles, setRestaurantesDisponibles] = useState<Array<{ id: string; nombre: string }>>([])

  useEffect(() => {
    async function fetchRestaurantes() {
      try {
        const response = await fetch('/api/restaurantes?activo=true')
        const data = await response.json()
        setRestaurantesDisponibles(data)
      } catch (error) {
        console.error('Error al cargar restaurantes:', error)
      }
    }
    fetchRestaurantes()
  }, [])

  useEffect(() => {
    async function fetchEmpleado() {
      try {
        const response = await fetch(`/api/empleados/${params.id}`)
        if (!response.ok) throw new Error('Error al cargar empleado')
        const data = await response.json()
        
        // Parsear días de descanso - puede ser array (formato antiguo) u objeto (formato nuevo)
        const diasDescansoRaw = parseJSON<any>(data.diasDescanso, {})
        let diasDescansoParsed: Record<string, 'completo' | 'medio-mañana' | 'medio-tarde' | null> = {
          Lunes: null,
          Martes: null,
          Miércoles: null,
          Jueves: null,
          Viernes: null,
          Sábado: null,
          Domingo: null,
        }
        
        // Si es un array (formato antiguo), convertir a objeto con "completo"
        if (Array.isArray(diasDescansoRaw)) {
          diasDescansoRaw.forEach((dia: string) => {
            diasDescansoParsed[dia] = 'completo'
          })
        } else if (typeof diasDescansoRaw === 'object' && diasDescansoRaw !== null) {
          // Es un objeto (formato nuevo)
          // Convertir valores antiguos "medio" a "medio-mañana" para compatibilidad
          Object.entries(diasDescansoRaw).forEach(([dia, valor]) => {
            if (valor === 'medio') {
              diasDescansoParsed[dia] = 'medio-mañana'
            } else if (valor === 'completo' || valor === 'medio-mañana' || valor === 'medio-tarde') {
              diasDescansoParsed[dia] = valor as 'completo' | 'medio-mañana' | 'medio-tarde'
            }
          })
        }
        
        setDiasDescanso(diasDescansoParsed)
        
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
          email: data.email || '',
          direccion: data.direccion || '',
          tipoSueldo: data.tipoSueldo || 'MENSUAL',
          sueldo: data.sueldo || 0,
          valorHoraExtra: data.valorHoraExtra || 0,
          fechaIngreso: data.fechaIngreso
            ? new Date(data.fechaIngreso).toISOString().split('T')[0]
            : '',
          fechaBaja: data.fechaBaja
            ? new Date(data.fechaBaja).toISOString().split('T')[0]
            : '',
          activo: data.activo ?? true,
          horarioEntrada: data.horarioEntrada || '',
          horarioSalida: data.horarioSalida || '',
          carnetManipulacionEmision: data.carnetManipulacionEmision
            ? new Date(data.carnetManipulacionEmision).toISOString().split('T')[0]
            : '',
          carnetManipulacionVencimiento: data.carnetManipulacionVencimiento
            ? new Date(data.carnetManipulacionVencimiento).toISOString().split('T')[0]
            : '',
          carnetSaludEmision: data.carnetSaludEmision
            ? new Date(data.carnetSaludEmision).toISOString().split('T')[0]
            : '',
          carnetSaludVencimiento: data.carnetSaludVencimiento
            ? new Date(data.carnetSaludVencimiento).toISOString().split('T')[0]
            : '',
          cuentaBancaria: data.cuentaBancaria || '',
          nombreBanco: data.nombreBanco || '',
        })
        
        // Cargar restaurantes asignados
        if (data.restaurantes && Array.isArray(data.restaurantes)) {
          const restaurantesIds = data.restaurantes.map((r: any) => r.restaurante?.id || r.restauranteId).filter(Boolean)
          setRestaurantesSeleccionados(restaurantesIds)
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cargar el empleado')
      } finally {
        setLoading(false)
      }
    }
    fetchEmpleado()
  }, [params.id])

  const cambiarDiaDescanso = (dia: string, valor: 'completo' | 'medio-mañana' | 'medio-tarde' | null) => {
    setDiasDescanso((prev) => ({ ...prev, [dia]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Convertir días de descanso a formato JSON, solo incluir días que no sean null
      const diasDescansoFiltrado = Object.fromEntries(
        Object.entries(diasDescanso).filter(([_, valor]) => valor !== null)
      )
      
      const payload = {
        ...formData,
        diasDescanso: Object.keys(diasDescansoFiltrado).length > 0 ? JSON.stringify(diasDescansoFiltrado) : null,
        carnetManipulacionEmision: formData.carnetManipulacionEmision || null,
        carnetManipulacionVencimiento: formData.carnetManipulacionVencimiento || null,
        carnetSaludEmision: formData.carnetSaludEmision || null,
        carnetSaludVencimiento: formData.carnetSaludVencimiento || null,
        restauranteIds: restaurantesSeleccionados,
      }

      const response = await fetch(`/api/empleados/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Error al actualizar empleado')

      router.push(`/empleados/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el empleado')
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
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Editar Empleado
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar información del empleado
          </p>
        </div>
        <Link href={`/empleados/${params.id}`} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Datos Personales */}
          <div>
            <h2 className="text-lg font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Datos Personales
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
                <label className="label">Apellido *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">DNI</label>
                <input
                  type="text"
                  className="input"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({ ...formData, dni: e.target.value })
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
            </div>
          </div>

          {/* Información Laboral */}
          <div>
            <h2 className="text-lg font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Información Laboral
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Tipo de Sueldo *</label>
                  <select
                    required
                    className="input"
                    value={formData.tipoSueldo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipoSueldo: e.target.value })
                    }
                  >
                    {TIPOS_SUELDO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sueldo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={formData.sueldo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sueldo: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Valor Hora Extra</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={formData.valorHoraExtra}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorHoraExtra: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Fecha de Ingreso *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.fechaIngreso}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaIngreso: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Fecha de Baja</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fechaBaja}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaBaja: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Horario de Entrada</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.horarioEntrada}
                    onChange={(e) =>
                      setFormData({ ...formData, horarioEntrada: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Horario de Salida</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.horarioSalida}
                    onChange={(e) =>
                      setFormData({ ...formData, horarioSalida: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label mb-2 block">Días de Descanso</label>
                <p className="text-xs text-neutral-500 mb-3">
                  Selecciona el tipo de descanso para cada día. Si es medio día, especifica el turno.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="space-y-1">
                      <label className="text-sm font-medium text-neutral-700">
                        {dia}
                      </label>
                      <select
                        className="input text-sm"
                        value={diasDescanso[dia] || ''}
                        onChange={(e) => {
                          const valor = e.target.value === '' ? null : (e.target.value as 'completo' | 'medio-mañana' | 'medio-tarde')
                          cambiarDiaDescanso(dia, valor)
                        }}
                      >
                        <option value="">Sin descanso</option>
                        <option value="completo">Día completo</option>
                        <option value="medio-mañana">Medio día (Mañana libre)</option>
                        <option value="medio-tarde">Medio día (Tarde libre)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Documentación Obligatoria */}
          <div>
            <h2 className="text-lg font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Documentación Obligatoria
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-neutral-700 mb-3">
                  Carnet de Manipulación de Alimentos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Fecha de Emisión</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.carnetManipulacionEmision}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carnetManipulacionEmision: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.carnetManipulacionVencimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carnetManipulacionVencimiento: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-md font-medium text-neutral-700 mb-3">
                  Carnet de Salud
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Fecha de Emisión</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.carnetSaludEmision}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carnetSaludEmision: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.carnetSaludVencimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carnetSaludVencimiento: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Bancarios */}
          <div>
            <h2 className="text-lg font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              Datos Bancarios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Número de Cuenta Bancaria</label>
                <input
                  type="text"
                  className="input"
                  value={formData.cuentaBancaria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cuentaBancaria: e.target.value,
                    })
                  }
                  placeholder="Ej: 1234567890123456789012"
                />
              </div>
              <div>
                <label className="label">Nombre del Banco</label>
                <input
                  type="text"
                  className="input"
                  value={formData.nombreBanco}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombreBanco: e.target.value,
                    })
                  }
                  placeholder="Ej: Banco Nacional, Banco Popular, etc."
                />
              </div>
            </div>
          </div>

          {/* Restaurantes */}
          {restaurantesDisponibles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111111] mb-4" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Restaurantes
              </h2>
              <p className="text-sm text-neutral-600 mb-3">
                Selecciona uno o varios restaurantes donde trabaja el empleado
              </p>
              <div className="space-y-2">
                {restaurantesDisponibles.map((restaurante) => (
                  <label
                    key={restaurante.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={restaurantesSeleccionados.includes(restaurante.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRestaurantesSeleccionados([
                            ...restaurantesSeleccionados,
                            restaurante.id,
                          ])
                        } else {
                          setRestaurantesSeleccionados(
                            restaurantesSeleccionados.filter(
                              (id) => id !== restaurante.id
                            )
                          )
                        }
                      }}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      {restaurante.nombre}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
                Empleado activo
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link href={`/empleados/${params.id}`} className="btn btn-ghost">
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

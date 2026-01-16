'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const TIPOS_SUELDO = ['MENSUAL', 'JORNAL']
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function NuevoEmpleadoPage() {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(false)

  // Solo ADMIN puede crear empleados
  useEffect(() => {
    if (!canEdit()) {
      router.push('/empleados')
    }
  }, [canEdit, router])
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
    fechaIngreso: new Date().toISOString().split('T')[0],
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
        if (!response.ok) {
          console.error('Error al cargar restaurantes:', response.status, response.statusText)
          return
        }
        const data = await response.json()
        console.log('Restaurantes cargados:', data)
        // Asegurar que data sea un array
        setRestaurantesDisponibles(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar restaurantes:', error)
        setRestaurantesDisponibles([])
      }
    }
    fetchRestaurantes()
  }, [])

  const cambiarDiaDescanso = (dia: string, valor: 'completo' | 'medio-mañana' | 'medio-tarde' | null) => {
    setDiasDescanso((prev) => ({ ...prev, [dia]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos requeridos
      if (!formData.nombre || !formData.apellido || !formData.tipoSueldo) {
        alert('Por favor complete todos los campos requeridos')
        setLoading(false)
        return
      }

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
        restauranteIds: Array.isArray(restaurantesSeleccionados) ? restaurantesSeleccionados : [],
      }

      console.log('Enviando payload:', payload)

      const response = await fetch('/api/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error al crear empleado')
      }

      const result = await response.json()
      console.log('Empleado creado exitosamente:', result)

      if (!result || !result.id) {
        console.error('Error: El empleado no se creó correctamente. Resultado:', result)
        alert('Error: El empleado no se creó correctamente. Ver consola para más detalles.')
        setLoading(false)
        return
      }

      // Redirigir después de crear exitosamente
      router.push('/empleados')
    } catch (error) {
      console.error('Error completo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el empleado'
      alert(`Error al crear el empleado: ${errorMessage}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111111]" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            Nuevo Empleado
          </h1>
          <p className="text-neutral-600 mt-1">
            Agregar un nuevo empleado al sistema
          </p>
        </div>
        <Link href="/empleados" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-8">
          {/* Datos Personales */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">
              Datos Personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">
              Información Laboral
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
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
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
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
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Restaurantes
            </h2>
            {restaurantesDisponibles.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-neutral-500 italic">
                No hay restaurantes disponibles. Los empleados se pueden crear sin asignar a un restaurante.
              </p>
            )}
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
                Empleado activo
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link href="/empleados" className="btn btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Guardando...' : 'Crear Empleado'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

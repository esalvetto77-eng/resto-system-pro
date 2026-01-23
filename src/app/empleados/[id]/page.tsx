// Página de detalle de Empleado
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  formatDateShort,
  formatCurrency,
  formatDateTime,
  parseJSON,
  calcularHorasTrabajadas,
  fechaVencida,
  fechaVencePronto,
} from '@/lib/utils'

interface Asistencia {
  id: string
  fecha: string
  horaEntrada: string | null
  horaSalida: string | null
  observaciones: string | null
}

interface Incidente {
  id: string
  fecha: string
  tipo: string
  descripcion: string
  severidad: string | null
}

interface Falta {
  id: string
  fecha: string
  justificada: boolean
  motivo: string | null
}

interface Observacion {
  id: string
  fecha: string
  titulo: string
  descripcion: string
}

interface Suspension {
  id: string
  fechaInicio: string
  fechaFin: string | null
  motivo: string
}

interface Documento {
  id: string
  nombre: string
  tipo: string
  ruta: string
  descripcion: string | null
  createdAt: string
}

interface Empleado {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  tipoSueldo: string
  sueldo: number | null
  fechaIngreso: string
  fechaBaja: string | null
  activo: boolean
  diasDescanso: string | null
  horarioEntrada: string | null
  horarioSalida: string | null
  carnetManipulacionEmision: string | null
  carnetManipulacionVencimiento: string | null
  carnetSaludEmision: string | null
  carnetSaludVencimiento: string | null
  cuentaBancaria: string | null
  nombreBanco: string | null
  asistencias: Asistencia[]
  incidentes: Incidente[]
  faltas: Falta[]
  observaciones: Observacion[]
  suspensiones: Suspension[]
  documentos: Documento[]
  restaurantes: Array<{
    restaurante: {
      id: string
      nombre: string
      ubicacion: string | null
    }
  }>
}

const TIPOS_INCIDENTE: Record<string, string> = {
  FALTA: 'Falta',
  RETRASO: 'Retraso',
  LLAMADO_ATENCION: 'Llamado de Atención',
  OTRO: 'Otro',
}

const SEVERIDAD: Record<string, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  GRAVE: 'Grave',
}

export default function EmpleadoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { canDelete } = useAuth()
  const [loading, setLoading] = useState(true)
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    nombre: '',
    descripcion: '',
    file: null as File | null,
  })

  useEffect(() => {
    fetchEmpleado()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function fetchEmpleado() {
    try {
      const response = await fetch(`/api/empleados/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar empleado')
      const data = await response.json()
      setEmpleado(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar el empleado')
    } finally {
      setLoading(false)
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.nombre) {
      alert('Por favor completa el nombre y selecciona un archivo')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('nombre', uploadForm.nombre)
      if (uploadForm.descripcion) {
        formData.append('descripcion', uploadForm.descripcion)
      }

      const response = await fetch(`/api/empleados/${params.id}/documentos/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = 'Error al subir el documento'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
          console.error('No se pudo parsear el error del servidor:', e)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Resetear formulario y recargar empleado
      setUploadForm({ nombre: '', descripcion: '', file: null })
      setShowUploadForm(false)
      await fetchEmpleado()
      
      // Mostrar mensaje de éxito
      alert('Documento subido exitosamente')
    } catch (error: any) {
      console.error('Error al subir documento:', error)
      // Mostrar el mensaje de error específico
      const errorMessage = error?.message || 'Error al subir el documento. Por favor, intenta nuevamente.'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Cargando empleado...</div>
      </div>
    )
  }

  if (!empleado) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-neutral-600 mb-4">Empleado no encontrado</p>
          <Link href="/empleados" className="btn btn-primary">
            Volver a Empleados
          </Link>
        </div>
      </div>
    )
  }

  // Parsear días de descanso
  const diasDescansoRaw = parseJSON<any>(empleado.diasDescanso, {})
  let diasDescansoParsed: Record<string, 'completo' | 'medio-mañana' | 'medio-tarde'> = {}
  if (Array.isArray(diasDescansoRaw)) {
    diasDescansoRaw.forEach((dia: string) => {
      diasDescansoParsed[dia] = 'completo'
    })
  } else if (typeof diasDescansoRaw === 'object' && diasDescansoRaw !== null) {
    // Convertir valores antiguos "medio" a "medio-mañana" para compatibilidad
    Object.entries(diasDescansoRaw).forEach(([dia, valor]) => {
      if (valor === 'medio') {
        diasDescansoParsed[dia] = 'medio-mañana'
      } else if (valor === 'completo' || valor === 'medio-mañana' || valor === 'medio-tarde') {
        diasDescansoParsed[dia] = valor as 'completo' | 'medio-mañana' | 'medio-tarde'
      }
    })
  }
  
  const horasTrabajadas = calcularHorasTrabajadas(empleado.horarioEntrada, empleado.horarioSalida)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {empleado.nombre} {empleado.apellido}
          </h1>
          <p className="text-neutral-600 mt-1">Detalle del empleado</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/empleados" className="btn btn-ghost">
            Volver
          </Link>
          <Link
            href={`/empleados/${empleado.id}/editar`}
            className="btn btn-primary"
          >
            Editar
          </Link>
          {canDelete() && (
            <button
              onClick={async () => {
                if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este empleado? Esta acción no se puede deshacer.')) {
                  return
                }
                setDeleting(true)
                try {
                  const response = await fetch(`/api/empleados/${empleado.id}`, {
                    method: 'DELETE',
                  })
                  if (!response.ok) throw new Error('Error al eliminar empleado')
                  router.push('/empleados')
                  router.refresh()
                } catch (error: any) {
                  alert(error?.message || 'Error al eliminar el empleado')
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
          {/* Información Personal */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Información Personal
              </h2>
            </div>
            <div className="card-body space-y-4">
              {empleado.dni && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">DNI</div>
                  <div className="text-base text-neutral-900">{empleado.dni}</div>
                </div>
              )}
              {empleado.telefono && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Teléfono
                  </div>
                  <div className="text-base text-neutral-900">
                    {empleado.telefono}
                  </div>
                </div>
              )}
              {empleado.email && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">Email</div>
                  <div className="text-base text-neutral-900">
                    {empleado.email}
                  </div>
                </div>
              )}
              {empleado.direccion && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Dirección
                  </div>
                  <div className="text-base text-neutral-900">
                    {empleado.direccion}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información Laboral */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">
                Información Laboral
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="text-sm font-medium text-neutral-500">
                  Tipo de Sueldo
                </div>
                <div className="text-base text-neutral-900">
                  {empleado.tipoSueldo}
                </div>
              </div>
              {empleado.sueldo && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Sueldo
                  </div>
                  <div className="text-base text-neutral-900">
                    {formatCurrency(empleado.sueldo)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-neutral-500">
                  Fecha de Ingreso
                </div>
                <div className="text-base text-neutral-900">
                  {formatDateShort(empleado.fechaIngreso)}
                </div>
              </div>
              {empleado.fechaBaja && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Fecha de Baja
                  </div>
                  <div className="text-base text-neutral-900">
                    {formatDateShort(empleado.fechaBaja)}
                  </div>
                </div>
              )}
              
              {/* Nuevos campos laborales */}
              {(empleado.horarioEntrada || empleado.horarioSalida) && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Horario de Trabajo
                  </div>
                  <div className="text-base text-neutral-900">
                    {empleado.horarioEntrada || '-'} - {empleado.horarioSalida || '-'}
                  </div>
                  {horasTrabajadas !== '-' && (
                    <div className="text-sm text-neutral-600 mt-1">
                      Horas diarias: {horasTrabajadas}
                    </div>
                  )}
                </div>
              )}
              
              {Object.keys(diasDescansoParsed).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-neutral-500">
                    Días de Descanso
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(diasDescansoParsed).map(([dia, tipo]) => (
                      <span
                        key={dia}
                        className={`badge ${
                          tipo === 'completo' ? 'badge-neutral' : 'badge-warning'
                        }`}
                      >
                        {dia} {tipo === 'medio-mañana' && '(Medio día - Mañana libre)'}
                        {tipo === 'medio-tarde' && '(Medio día - Tarde libre)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documentación Obligatoria */}
          {(empleado.carnetManipulacionEmision ||
            empleado.carnetManipulacionVencimiento ||
            empleado.carnetSaludEmision ||
            empleado.carnetSaludVencimiento) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Documentación Obligatoria
                </h2>
              </div>
              <div className="card-body space-y-4">
                {/* Carnet de Manipulación */}
                {(empleado.carnetManipulacionEmision ||
                  empleado.carnetManipulacionVencimiento) && (
                  <div>
                    <h3 className="text-md font-medium text-neutral-700 mb-2">
                      Carnet de Manipulación de Alimentos
                    </h3>
                    <div className="space-y-2">
                      {empleado.carnetManipulacionEmision && (
                        <div>
                          <div className="text-sm font-medium text-neutral-500">
                            Fecha de Emisión
                          </div>
                          <div className="text-base text-neutral-900">
                            {formatDateShort(empleado.carnetManipulacionEmision)}
                          </div>
                        </div>
                      )}
                      {empleado.carnetManipulacionVencimiento && (
                        <div>
                          <div className="text-sm font-medium text-neutral-500">
                            Fecha de Vencimiento
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-base text-neutral-900">
                              {formatDateShort(empleado.carnetManipulacionVencimiento)}
                            </div>
                            {fechaVencida(empleado.carnetManipulacionVencimiento) && (
                              <span className="badge badge-error">Vencido</span>
                            )}
                            {!fechaVencida(empleado.carnetManipulacionVencimiento) &&
                              fechaVencePronto(empleado.carnetManipulacionVencimiento) && (
                                <span className="badge badge-warning">
                                  Vence Pronto
                                </span>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Carnet de Salud */}
                {(empleado.carnetSaludEmision ||
                  empleado.carnetSaludVencimiento) && (
                  <div>
                    <h3 className="text-md font-medium text-neutral-700 mb-2">
                      Carnet de Salud
                    </h3>
                    <div className="space-y-2">
                      {empleado.carnetSaludEmision && (
                        <div>
                          <div className="text-sm font-medium text-neutral-500">
                            Fecha de Emisión
                          </div>
                          <div className="text-base text-neutral-900">
                            {formatDateShort(empleado.carnetSaludEmision)}
                          </div>
                        </div>
                      )}
                      {empleado.carnetSaludVencimiento && (
                        <div>
                          <div className="text-sm font-medium text-neutral-500">
                            Fecha de Vencimiento
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-base text-neutral-900">
                              {formatDateShort(empleado.carnetSaludVencimiento)}
                            </div>
                            {fechaVencida(empleado.carnetSaludVencimiento) && (
                              <span className="badge badge-error">Vencido</span>
                            )}
                            {!fechaVencida(empleado.carnetSaludVencimiento) &&
                              fechaVencePronto(empleado.carnetSaludVencimiento) && (
                                <span className="badge badge-warning">
                                  Vence Pronto
                                </span>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Datos Bancarios */}
          {(empleado.cuentaBancaria || empleado.nombreBanco) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Datos Bancarios
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {empleado.cuentaBancaria && (
                    <div>
                      <div className="text-sm font-medium text-neutral-500">
                        Cuenta Bancaria
                      </div>
                      <div className="text-base text-neutral-900">
                        {empleado.cuentaBancaria}
                      </div>
                    </div>
                  )}
                  {empleado.nombreBanco && (
                    <div>
                      <div className="text-sm font-medium text-neutral-500">
                        Banco
                      </div>
                      <div className="text-base text-neutral-900">
                        {empleado.nombreBanco}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Restaurantes */}
          {empleado.restaurantes && empleado.restaurantes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Restaurantes
                </h2>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {empleado.restaurantes.map((er) => (
                    <span
                      key={er.restaurante.id}
                      className="badge badge-primary"
                    >
                      {er.restaurante.nombre}
                      {er.restaurante.ubicacion && (
                        <span className="ml-1 text-xs opacity-75">
                          ({er.restaurante.ubicacion})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Faltas */}
          {empleado.faltas && empleado.faltas.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Faltas ({empleado.faltas.length})
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {empleado.faltas.map((falta) => (
                    <div
                      key={falta.id}
                      className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-900">
                              {formatDateShort(falta.fecha)}
                            </span>
                            {falta.justificada ? (
                              <span className="badge badge-success">
                                Justificada
                              </span>
                            ) : (
                              <span className="badge badge-error">
                                No Justificada
                              </span>
                            )}
                          </div>
                          {falta.motivo && (
                            <div className="text-sm text-neutral-600">
                              {falta.motivo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {empleado.observaciones && empleado.observaciones.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Observaciones ({empleado.observaciones.length})
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {empleado.observaciones.map((obs) => (
                    <div
                      key={obs.id}
                      className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900 mb-1">
                            {obs.titulo}
                          </div>
                          <div className="text-sm text-neutral-600 mb-2">
                            {formatDateShort(obs.fecha)}
                          </div>
                          <div className="text-sm text-neutral-700">
                            {obs.descripcion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Suspensiones */}
          {empleado.suspensiones && empleado.suspensiones.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Suspensiones ({empleado.suspensiones.length})
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {empleado.suspensiones.map((suspension) => (
                    <div
                      key={suspension.id}
                      className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900 mb-1">
                            {formatDateShort(suspension.fechaInicio)}
                            {suspension.fechaFin
                              ? ` - ${formatDateShort(suspension.fechaFin)}`
                              : ' (En curso)'}
                          </div>
                          <div className="text-sm text-neutral-700">
                            {suspension.motivo}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documentos Adjuntos */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Documentos Adjuntos ({empleado.documentos?.length || 0})
              </h2>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="btn btn-primary btn-sm"
              >
                {showUploadForm ? 'Cancelar' : '+ Agregar Documento'}
              </button>
            </div>
            <div className="card-body">
              {/* Formulario de subida */}
              {showUploadForm && (
                <form onSubmit={handleUploadDocument} className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                  <div className="space-y-4">
                    <div>
                      <label className="label">Nombre del Documento *</label>
                      <input
                        type="text"
                        required
                        className="input"
                        value={uploadForm.nombre}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, nombre: e.target.value })
                        }
                        placeholder="Ej: Contrato, DNI, etc."
                      />
                    </div>
                    <div>
                      <label className="label">Descripción (opcional)</label>
                      <textarea
                        className="input"
                        value={uploadForm.descripcion}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, descripcion: e.target.value })
                        }
                        rows={2}
                        placeholder="Descripción del documento..."
                      />
                    </div>
                    <div>
                      <label className="label">Archivo *</label>
                      <input
                        type="file"
                        required
                        className="input"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setUploadForm({ ...uploadForm, file })
                        }}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Formatos permitidos: PDF, JPG, PNG, GIF, WEBP
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="btn btn-primary"
                      >
                        {uploading ? 'Subiendo...' : 'Subir Documento'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUploadForm(false)
                          setUploadForm({ nombre: '', descripcion: '', file: null })
                        }}
                        className="btn btn-ghost"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista de documentos */}
              {empleado.documentos && empleado.documentos.length > 0 ? (
                <div className="space-y-3">
                  {empleado.documentos.map((doc) => {
                    const esImagen = ['IMAGEN'].includes(doc.tipo)
                    const esPDF = doc.tipo === 'PDF'
                    const urlVer = `/api/empleados/${empleado.id}/documentos/${doc.id}/view`
                    
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">
                            {doc.nombre}
                          </div>
                          {doc.descripcion && (
                            <div className="text-sm text-neutral-600">
                              {doc.descripcion}
                            </div>
                          )}
                          <div className="text-xs text-neutral-500 mt-1">
                            {doc.tipo} • {formatDateShort(doc.createdAt)}
                          </div>
                        </div>
                        <a
                          href={urlVer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          {esImagen ? 'Ver Imagen' : esPDF ? 'Ver PDF' : 'Ver'}
                        </a>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">
                  No hay documentos adjuntos
                </p>
              )}
            </div>
          </div>

          {/* Asistencias Recientes */}
          {empleado.asistencias && empleado.asistencias.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Asistencias Recientes
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {empleado.asistencias.map((asistencia) => (
                    <div
                      key={asistencia.id}
                      className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-neutral-900">
                            {formatDateShort(asistencia.fecha)}
                          </div>
                          {asistencia.horaEntrada && (
                            <div className="text-sm text-neutral-600">
                              Entrada: {formatDateTime(asistencia.horaEntrada)}
                            </div>
                          )}
                          {asistencia.horaSalida && (
                            <div className="text-sm text-neutral-600">
                              Salida: {formatDateTime(asistencia.horaSalida)}
                            </div>
                          )}
                          {asistencia.observaciones && (
                            <div className="text-sm text-neutral-500 mt-1">
                              {asistencia.observaciones}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Incidentes Recientes */}
          {empleado.incidentes && empleado.incidentes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Incidentes Recientes
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {empleado.incidentes.map((incidente) => (
                    <div
                      key={incidente.id}
                      className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-neutral-900">
                              {TIPOS_INCIDENTE[incidente.tipo] ||
                                incidente.tipo}
                            </span>
                            {incidente.severidad && (
                              <span className="badge badge-warning">
                                {SEVERIDAD[incidente.severidad] ||
                                  incidente.severidad}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600 mb-1">
                            {formatDateShort(incidente.fecha)}
                          </div>
                          <div className="text-sm text-neutral-700">
                            {incidente.descripcion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-neutral-900">Estado</h2>
            </div>
            <div className="card-body">
              {empleado.activo ? (
                <span className="badge badge-success">Activo</span>
              ) : (
                <span className="badge badge-neutral">Inactivo</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

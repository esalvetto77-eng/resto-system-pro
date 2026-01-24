'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const UNIDADES = [
  'kg',
  'g',
  'litro',
  'ml',
  'unidad',
  'paquete',
  'caja',
  'bolsa',
  'botella',
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

export default function EditarProductoPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [loading, setLoading] = useState(true)

  // Solo ADMIN puede editar productos
  useEffect(() => {
    if (!canEdit()) {
      router.push(`/productos/${params.id}`)
    }
  }, [canEdit, router, params.id])
  const [saving, setSaving] = useState(false)
  const [proveedores, setProveedores] = useState<
    Array<{ id: string; nombre: string }>
  >([])
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    unidad: 'kg',
    stockMinimo: 0,
    rubro: '',
    activo: true,
  })
  const [cotizacionDolar, setCotizacionDolar] = useState<number | null>(null)
  const [proveedoresProducto, setProveedoresProducto] = useState<
    Array<{ 
      proveedorId: string
      precioCompra: number | null
      moneda: 'USD' | 'UYU'
      ordenPreferencia: number
    }>
  >([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener cotización del dólar
        const cotizacionRes = await fetch('/api/cotizacion-dolar')
        if (cotizacionRes.ok) {
          const cotizacionData = await cotizacionRes.json()
          const promedio = (cotizacionData.compra + cotizacionData.venta) / 2
          setCotizacionDolar(promedio)
        }
        
        const [productoRes, proveedoresRes] = await Promise.all([
          fetch(`/api/productos/${params.id}`),
          fetch('/api/proveedores?activo=true'),
        ])

        if (!productoRes.ok) {
          let errorData
          try {
            errorData = await productoRes.json()
          } catch {
            errorData = { error: `Error HTTP ${productoRes.status}: ${productoRes.statusText}` }
          }
          console.error('[EDITAR PRODUCTO] Error en respuesta:', productoRes.status, errorData)
          throw new Error(errorData.error || `Error al cargar producto (${productoRes.status})`)
        }
        if (!proveedoresRes.ok) {
          const errorData = await proveedoresRes.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(errorData.error || 'Error al cargar proveedores')
        }

        const producto = await productoRes.json()
        const proveedoresData = await proveedoresRes.json()

        console.log('[EDITAR PRODUCTO] Producto recibido:', producto)
        console.log('[EDITAR PRODUCTO] Proveedores del producto:', producto.proveedores)

        if (!producto || !producto.id) {
          console.error('[EDITAR PRODUCTO] Producto inválido:', producto)
          throw new Error('Datos del producto inválidos')
        }

        setProveedores(Array.isArray(proveedoresData) ? proveedoresData : [])
        setFormData({
          nombre: producto.nombre || '',
          codigo: producto.codigo || '',
          descripcion: producto.descripcion || '',
          unidad: producto.unidad || 'kg',
          stockMinimo: producto.stockMinimo || 0,
          rubro: producto.rubro || '',
          activo: producto.activo ?? true,
        })

        // Cargar proveedores del producto
        if (producto.proveedores && Array.isArray(producto.proveedores) && producto.proveedores.length > 0) {
          setProveedoresProducto(
            producto.proveedores.map((pp: any) => ({
              proveedorId: pp.proveedor?.id || '',
              precioCompra: pp.precioCompra || null,
              moneda: pp.moneda || 'UYU',
              ordenPreferencia: pp.ordenPreferencia || 1,
            }))
          )
        } else {
          setProveedoresProducto([
            { proveedorId: '', precioCompra: null, moneda: 'UYU', ordenPreferencia: 1 },
          ])
        }
      } catch (error: any) {
        console.error('[EDITAR PRODUCTO] Error completo:', error)
        console.error('[EDITAR PRODUCTO] Error message:', error?.message)
        console.error('[EDITAR PRODUCTO] Error stack:', error?.stack)
        alert(`Error al obtener producto: ${error?.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`)
        router.push('/productos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id, router])

  const addProveedor = () => {
    setProveedoresProducto([
      ...proveedoresProducto,
      {
        proveedorId: '',
        precioCompra: null,
        moneda: 'UYU',
        ordenPreferencia: proveedoresProducto.length + 1,
      },
    ])
  }

  const removeProveedor = (index: number) => {
    const nuevos = proveedoresProducto.filter((_, i) => i !== index)
    nuevos.forEach((p, i) => {
      p.ordenPreferencia = i + 1
    })
    setProveedoresProducto(nuevos)
  }

  const updateProveedor = (
    index: number,
    field: 'proveedorId' | 'precioCompra' | 'moneda' | 'ordenPreferencia',
    value: string | number | null
  ) => {
    const nuevos = [...proveedoresProducto]
    if (field === 'precioCompra') {
      nuevos[index].precioCompra = value === '' ? null : Number(value)
    } else if (field === 'ordenPreferencia') {
      nuevos[index].ordenPreferencia = Number(value)
    } else if (field === 'moneda') {
      nuevos[index].moneda = value as 'USD' | 'UYU'
    } else {
      nuevos[index].proveedorId = value as string
    }
    setProveedoresProducto(nuevos)
  }

  const calcularPrecioEnPesos = (precio: number | null, moneda: 'USD' | 'UYU'): number | null => {
    if (!precio || !cotizacionDolar) return null
    if (moneda === 'UYU') return precio
    return precio * cotizacionDolar
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const proveedoresValidos = proveedoresProducto.filter(
      (p) => p.proveedorId !== ''
    )

    if (proveedoresValidos.length === 0) {
      alert('Debe agregar al menos un proveedor')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/productos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          proveedores: proveedoresValidos,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar producto')
      }

      router.push(`/productos/${params.id}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al actualizar el producto')
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
            Editar Producto
          </h1>
          <p className="text-neutral-600 mt-1">
            Modificar información del producto
          </p>
        </div>
        <Link href={`/productos/${params.id}`} className="btn btn-ghost">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Información Básica
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
                <label className="label">Código</label>
                <input
                  type="text"
                  className="input"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="Código interno opcional"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Unidad *</label>
                <select
                  required
                  className="input"
                  value={formData.unidad}
                  onChange={(e) =>
                    setFormData({ ...formData, unidad: e.target.value })
                  }
                >
                  {UNIDADES.map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Rubro</label>
                <select
                  className="input"
                  value={formData.rubro}
                  onChange={(e) =>
                    setFormData({ ...formData, rubro: e.target.value })
                  }
                >
                  <option value="">Seleccionar rubro</option>
                  {RUBROS.map((rubro) => (
                    <option key={rubro} value={rubro}>
                      {rubro.charAt(0).toUpperCase() + rubro.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Proveedores */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Proveedores y Precios
              </h2>
              <button
                type="button"
                onClick={addProveedor}
                className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
              >
                + Agregar Proveedor
              </button>
            </div>
            <div className="space-y-4">
              {proveedoresProducto.map((prov, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-neutral-200 rounded-soft"
                >
                  <div>
                    <label className="label">Proveedor *</label>
                    <select
                      required
                      className="input"
                      value={prov.proveedorId}
                      onChange={(e) =>
                        updateProveedor(index, 'proveedorId', e.target.value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {proveedores.map((proveedor) => (
                        <option key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Moneda</label>
                    <select
                      className="input"
                      value={prov.moneda}
                      onChange={(e) =>
                        updateProveedor(index, 'moneda', e.target.value)
                      }
                    >
                      <option value="UYU">UYU (Pesos)</option>
                      <option value="USD">USD (Dólares)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Precio {prov.moneda === 'USD' ? '(USD)' : '(UYU)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input"
                      value={prov.precioCompra || ''}
                      onChange={(e) =>
                        updateProveedor(index, 'precioCompra', e.target.value)
                      }
                      placeholder="Opcional"
                    />
                    {prov.moneda === 'USD' && prov.precioCompra && cotizacionDolar && (
                      <div className="mt-1 text-xs text-neutral-600">
                        ≈ {calcularPrecioEnPesos(prov.precioCompra, 'USD')?.toFixed(2)} UYU
                        <span className="text-neutral-400 ml-1">
                          (Cotización: ${cotizacionDolar.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Orden</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={prov.ordenPreferencia}
                      onChange={(e) =>
                        updateProveedor(
                          index,
                          'ordenPreferencia',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    {proveedoresProducto.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProveedor(index)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Orden: 1 = primera opción, 2 = segunda opción, etc.
            </p>
          </div>

          {/* Stock */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Stock
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="label">Stock Mínimo *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  value={formData.stockMinimo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockMinimo: parseFloat(e.target.value) || 0,
                    })
                  }
                />
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
                Producto activo
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
            <Link href={`/productos/${params.id}`} className="btn btn-ghost">
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

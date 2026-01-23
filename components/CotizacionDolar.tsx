'use client'

import { useState, useEffect } from 'react'

interface Cotizacion {
  compra: number
  venta: number
  fecha: string
  fuente: string
}

export function CotizacionDolar() {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchCotizacion() {
      try {
        setLoading(true)
        const response = await fetch('/api/cotizacion-dolar')
        
        if (!response.ok) {
          throw new Error('Error al obtener cotización')
        }
        
        const data = await response.json()
        setCotizacion(data)
        setError(false)
      } catch (err) {
        console.error('Error al cargar cotización:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchCotizacion()
    
    // Actualizar cada hora
    const interval = setInterval(fetchCotizacion, 3600000) // 1 hora
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs">
        <span className="text-neutral-500">USD:</span>
        <span className="text-neutral-400">Cargando...</span>
      </div>
    )
  }

  if (error || !cotizacion) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
        <span className="text-yellow-700">USD:</span>
        <span className="text-yellow-600">Error</span>
      </div>
    )
  }

  // Usar el promedio de compra y venta para mostrar
  const promedio = ((cotizacion.compra + cotizacion.venta) / 2).toFixed(2)

  return (
    <div className="flex flex-col items-end gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-md shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-600">USD BROU:</span>
        <span className="text-sm font-semibold text-neutral-900">
          ${promedio} UYU
        </span>
      </div>
      <div className="text-xs text-neutral-500">
        {cotizacion.fecha} • {cotizacion.fuente}
      </div>
    </div>
  )
}

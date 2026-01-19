'use client'

import { useRestaurante } from '@/contexts/RestauranteContext'

export function RestauranteSelector() {
  const { restauranteActivo, setRestauranteActivo, restaurantes, loading } =
    useRestaurante()

  // Asegurar que restaurantes sea un array
  const restaurantesArray = Array.isArray(restaurantes) ? restaurantes : []

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide" style={{ fontWeight: 500, lineHeight: 1.6 }}>
          Restaurante Activo
        </div>
        <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-soft text-neutral-400 text-sm" style={{ fontWeight: 400, lineHeight: 1.6 }}>
          Cargando...
        </div>
      </div>
    )
  }

  if (restaurantesArray.length === 0) {
    return (
      <div className="w-full">
        <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide" style={{ fontWeight: 500, lineHeight: 1.6 }}>
          Restaurante Activo
        </div>
        <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-soft text-neutral-500 text-sm" style={{ fontWeight: 400, lineHeight: 1.6 }}>
          Sin restaurantes
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wide" style={{ fontWeight: 500, lineHeight: 1.6 }}>
        Restaurante Activo
      </label>
      <select
        className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-soft text-sm focus:outline-none focus:ring-1 focus:ring-terracotta-500 focus:border-terracotta-500 transition-colors"
        style={{ fontWeight: 400, lineHeight: 1.6, color: '#111111' }}
        value={restauranteActivo?.id || ''}
        onChange={(e) => {
          const restaurante = restaurantesArray.find((r) => r.id === e.target.value)
          if (restaurante) {
            setRestauranteActivo(restaurante)
          }
        }}
      >
        {restaurantesArray.map((restaurante) => (
          <option key={restaurante.id} value={restaurante.id} className="bg-white">
            {restaurante.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Restaurante {
  id: string
  nombre: string
  ubicacion?: string | null
  activo: boolean
}

interface RestauranteContextType {
  restauranteActivo: Restaurante | null
  setRestauranteActivo: (restaurante: Restaurante | null) => void
  restaurantes: Restaurante[]
  loading: boolean
}

const RestauranteContext = createContext<RestauranteContextType | undefined>(undefined)

export function RestauranteProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [restauranteActivo, setRestauranteActivoState] = useState<Restaurante | null>(null)
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/restaurantes?activo=true', { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        const restaurantesData = Array.isArray(data) ? data : []
        setRestaurantes(restaurantesData)

        const storedId = localStorage.getItem('restauranteActivoId')
        if (storedId && restaurantesData.length > 0) {
          const restaurante = restaurantesData.find((r: Restaurante) => r.id === storedId)
          if (restaurante) {
            setRestauranteActivoState(restaurante)
          } else if (restaurantesData.length > 0) {
            setRestauranteActivoState(restaurantesData[0])
            localStorage.setItem('restauranteActivoId', restaurantesData[0].id)
          }
        } else if (restaurantesData.length > 0) {
          setRestauranteActivoState(restaurantesData[0])
          localStorage.setItem('restauranteActivoId', restaurantesData[0].id)
        }
      } catch (error: any) {
        console.error('Error al cargar restaurantes:', error)
        setRestaurantes([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const setRestauranteActivo = (restaurante: Restaurante | null) => {
    setRestauranteActivoState(restaurante)
    if (restaurante) {
      localStorage.setItem('restauranteActivoId', restaurante.id)
    } else {
      localStorage.removeItem('restauranteActivoId')
    }
  }

  return (
    <RestauranteContext.Provider
      value={{
        restauranteActivo,
        setRestauranteActivo,
        restaurantes,
        loading,
      }}
    >
      {children}
    </RestauranteContext.Provider>
  )
}

export function useRestaurante() {
  const context = useContext(RestauranteContext)
  if (context === undefined) {
    throw new Error('useRestaurante debe usarse dentro de RestauranteProvider')
  }
  return context
}

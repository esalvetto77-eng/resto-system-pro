'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RestauranteSelector } from '@/components/RestauranteSelector'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Proveedores', href: '/proveedores' },
  { name: 'Productos', href: '/productos' },
  { name: 'Inventario', href: '/inventario' },
  { name: 'Pedidos', href: '/pedidos' },
  { name: 'Empleados', href: '/empleados' },
  { name: 'Turnos', href: '/turnos' },
  { name: 'Ajustes Turno', href: '/ajustes-turno' },
  { name: 'Eventos Mensuales', href: '/eventos-mensuales' },
  { name: 'Liquidaciones', href: '/liquidaciones' },
  { name: 'Liquidaciones Pro', href: '/liquidaciones-profesionales' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl text-terracotta-600" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                Gestión Restaurantes
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-terracotta-50 text-terracotta-700'
                        : 'text-[#111111] hover:bg-neutral-100'
                    }`}
                    style={{ fontWeight: 400, lineHeight: 1.6, letterSpacing: 'normal' }}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <RestauranteSelector />
        </div>
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RestauranteSelector } from '@/components/RestauranteSelector'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Building2, Users, CalendarDays, Settings, Wallet, FileText, Package, Utensils, Warehouse, ShoppingCart, BookOpen, LogOut, DollarSign } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: false },
  { name: 'Restaurantes', href: '/restaurantes', icon: Building2, adminOnly: true },
  { name: 'Empleados', href: '/empleados', icon: Users, adminOnly: true },
  { name: 'Turnos', href: '/turnos', icon: CalendarDays, adminOnly: false },
  { name: 'Ajustes Turno', href: '/ajustes-turno', icon: Settings, adminOnly: false },
  { name: 'Liquidaciones', href: '/liquidaciones-profesionales', icon: Wallet, adminOnly: true },
  { name: 'Eventos Mensuales', href: '/eventos-mensuales', icon: FileText, adminOnly: true },
  { name: 'Proveedores', href: '/proveedores', icon: Package, adminOnly: false },
  { name: 'Productos', href: '/productos', icon: Utensils, adminOnly: false },
  { name: 'Recetas', href: '/recetas', icon: BookOpen, adminOnly: false },
  { name: 'Inventario', href: '/inventario', icon: Warehouse, adminOnly: false },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart, adminOnly: false },
  { name: 'Ventas', href: '/ventas', icon: DollarSign, adminOnly: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdmin, loading } = useAuth()

  // No mostrar sidebar en login o si está cargando sin usuario
  if (pathname === '/login' || (loading && !user)) {
    return null
  }

  // Si no hay usuario después de cargar, no mostrar sidebar
  if (!loading && !user) {
    return null
  }

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      await logout()
    }
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-neutral-50 border-r border-neutral-200 flex flex-col z-50">
      {/* Logo/Header */}
      <div className="px-6 py-8 border-b border-neutral-200">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-terracotta-600 rounded-soft flex items-center justify-center">
            <span className="text-white text-xl" style={{ fontWeight: 600, lineHeight: 1.5 }}>G</span>
          </div>
          <div>
            <div className="text-[#111111] text-lg" style={{ fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em' }}>Gestión</div>
            <div className="text-neutral-500 text-xs" style={{ fontWeight: 400, lineHeight: 1.6 }}>Restaurantes</div>
          </div>
        </Link>
      </div>

      {/* Restaurante Selector */}
      <div className="px-6 py-6 border-b border-neutral-200">
        <RestauranteSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
        {navigation
          .filter((item) => isAdmin() || !item.adminOnly)
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const IconComponent = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-soft text-sm transition-all duration-200 border ${
                  isActive
                    ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-200 font-medium'
                    : 'bg-white text-[#111111] border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                }`}
                style={{ fontWeight: 400, lineHeight: 1.6, letterSpacing: 'normal' }}
              >
                {IconComponent && <IconComponent size={18} strokeWidth={1.5} />}
                <span>{item.name}</span>
              </Link>
            )
          })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-neutral-200 space-y-4">
        {user && (
          <div className="text-xs text-neutral-600 mb-2">
            <div className="font-medium" style={{ fontWeight: 500 }}>
              {user.nombre}
            </div>
            <div className="text-neutral-500 mt-1">
              {isAdmin() ? 'Dueño' : 'Encargado'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-soft transition-colors"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Cerrar Sesión</span>
        </button>
        <div className="text-xs text-neutral-400 text-center" style={{ fontWeight: 400, lineHeight: 1.6 }}>
          Sistema Premium
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RestauranteProvider } from '@/contexts/RestauranteContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { CotizacionDolar } from '@/components/CotizacionDolar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Sistema de Gestión - Restaurantes',
  description: 'Sistema interno de gestión para restaurantes multi-sucursal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400, lineHeight: 1.6, color: '#111111' }}>
        <AuthProvider>
          <RestauranteProvider>
            <div className="flex min-h-screen bg-neutral-50">
              <Sidebar />
              <main className="flex-1 ml-64">
                <div className="relative">
                  {/* Cotización del dólar en esquina superior derecha */}
                  <div className="absolute top-4 right-4 z-10">
                    <CotizacionDolar />
                  </div>
                  <div className="p-12">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </RestauranteProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


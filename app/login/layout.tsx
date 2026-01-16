import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Sistema de Gestión',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

'use client'

import { useAuth } from '@/contexts/AuthContext'

interface ProtectedPriceProps {
  value: number | string | null | undefined
  formatter?: (value: number) => string
  fallback?: React.ReactNode
  className?: string
}

export function ProtectedPrice({
  value,
  formatter = (v) => `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  fallback = <span className="text-neutral-400 text-sm">-</span>,
  className = '',
}: ProtectedPriceProps) {
  const { canSeePrices } = useAuth()

  if (!canSeePrices()) {
    return <>{fallback}</>
  }

  if (value === null || value === undefined || value === '') {
    return <>{fallback}</>
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return <>{fallback}</>
  }

  return <span className={className}>{formatter(numValue)}</span>
}

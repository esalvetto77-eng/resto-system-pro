import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-neutral-50 border-b border-neutral-100 ${className}`}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-neutral-100 ${className}`}>
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
  header?: boolean
}

export function TableCell({ children, className = '', header = false }: TableCellProps) {
  const baseClasses = 'px-6 py-4 text-sm'

  if (header) {
    return (
      <th 
        className={`${baseClasses} text-left ${className}`}
        style={{ fontWeight: 500, color: '#111111', lineHeight: 1.6, letterSpacing: 'normal' }}
      >
        {children}
      </th>
    )
  }

  return (
    <td 
      className={`${baseClasses} ${className}`}
      style={{ fontWeight: 400, color: '#111111', lineHeight: 1.7, letterSpacing: 'normal' }}
    >
      {children}
    </td>
  )
}

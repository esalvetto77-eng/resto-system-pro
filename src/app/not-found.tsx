import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="card max-w-md w-full">
        <div className="card-body text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            404
          </h2>
          <p className="text-xl text-neutral-600 mb-2">
            Página no encontrada
          </p>
          <p className="text-neutral-500 mb-6">
            La página que buscas no existe o ha sido movida.
          </p>
          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

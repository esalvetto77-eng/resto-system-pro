// Página de detalle de Receta
import RecetaDetailPageClient from './page-client'

export default function RecetaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <RecetaDetailPageClient id={params.id} />
}

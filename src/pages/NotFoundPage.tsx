import { Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/ui'

export function NotFoundPage() {
  return (
    <EmptyState icon={<Sprout className="size-8" />} title="Página no encontrada">
      <Link to="/" className="font-medium text-accent">
        Volver a Hoy
      </Link>
    </EmptyState>
  )
}

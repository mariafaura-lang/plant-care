import { Leaf } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/ui'

export function PlantsPage() {
  return (
    <>
      <PageHeader title="Mis plantas" />
      <EmptyState icon={<Leaf className="size-8" />} title="Aún no tienes plantas">
        Aquí podrás añadir tus plantas, agruparlas por habitación y buscarlas. (Fase 2)
      </EmptyState>
    </>
  )
}

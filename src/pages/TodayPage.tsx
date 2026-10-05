import { Droplets } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/ui'
import { formatLongDate, today } from '../lib/dates'

export function TodayPage() {
  return (
    <>
      <PageHeader title="Hoy" subtitle={formatLongDate(today())} />
      <EmptyState icon={<Droplets className="size-8" />} title="Nada que regar todavía">
        Aquí verás las plantas que tocan hoy, las atrasadas y las de los próximos 7 días. (Fase 3)
      </EmptyState>
    </>
  )
}

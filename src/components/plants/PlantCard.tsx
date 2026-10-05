import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Plant, Species } from '../../types'
import { PlantPhoto } from './PlantPhoto'

export function PlantCard({ plant, species, extra }: { plant: Plant; species?: Species; extra?: ReactNode }) {
  return (
    <Link
      to={`/plantas/${plant.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 pr-3 transition active:scale-[0.99]"
    >
      <PlantPhoto photo={plant.photo} alt="" className="size-16 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{plant.nickname}</p>
        <p className="truncate text-sm text-muted">{species?.commonName ?? 'Especie sin indicar'}</p>
        {extra}
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  )
}

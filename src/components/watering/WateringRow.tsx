import clsx from 'clsx'
import { Clock, Droplets } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PlantSchedule } from '../../lib/watering'
import { wateringStatusText } from '../../lib/wateringText'
import type { ISODate } from '../../types'
import { PlantPhoto } from '../plants/PlantPhoto'

/** Fila de la vista "Hoy": planta, estado y botones "Regada" / "Más tarde". */
export function WateringRow({
  entry,
  today,
  onWater,
  onSnooze,
}: {
  entry: PlantSchedule
  today: ISODate
  onWater?: () => void
  onSnooze?: () => void
}) {
  const { plant, status } = entry
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5">
      <Link to={`/plantas/${plant.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <PlantPhoto photo={plant.photo} alt="" className="size-14 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{plant.nickname}</p>
          <p className={clsx('truncate text-sm', status === 'atrasada' ? 'font-medium text-danger' : status === 'hoy' ? 'text-water' : 'text-muted')}>
            {wateringStatusText(entry, today)}
          </p>
          <p className="truncate text-xs text-muted">{plant.room}</p>
        </div>
      </Link>
      {onSnooze && (
        <button
          type="button"
          onClick={onSnooze}
          aria-label={`Más tarde: ${plant.nickname}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-alt text-muted"
        >
          <Clock className="size-5" />
        </button>
      )}
      {onWater && (
        <button
          type="button"
          onClick={onWater}
          aria-label={`Regada: ${plant.nickname}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-water text-white dark:text-bg"
        >
          <Droplets className="size-5" />
        </button>
      )}
    </div>
  )
}

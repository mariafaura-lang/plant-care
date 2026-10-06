import { ChevronRight, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlantDiagnoses } from '../../hooks/useDiagnoses'
import { formatLongDate } from '../../lib/dates'
import { findCause, LIKELIHOOD_LABELS, likelihood } from '../../lib/diagnosis'
import type { Plant } from '../../types'

/** Sección "Diagnósticos" de la ficha de una planta. */
export function PlantDiagnoses({ plant }: { plant: Plant }) {
  const diagnoses = usePlantDiagnoses(plant.id)

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Diagnósticos</h2>
      <Link
        to={`/diagnostico?planta=${encodeURIComponent(plant.id)}`}
        className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3 text-sm font-medium text-accent"
      >
        <Stethoscope className="size-5" />
        ¿Qué le pasa a {plant.nickname}?
      </Link>
      {diagnoses && diagnoses.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {diagnoses.map((d) => {
            const best = d.results[0]
            const cause = best && findCause(best.causeId)
            return (
              <li key={d.id}>
                <Link to={`/diagnostico/${d.id}`} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {cause ? cause.name : 'Sin causa clara'}
                      {best && <span className="font-normal text-muted"> · {LIKELIHOOD_LABELS[likelihood(best.probability)].toLowerCase()}</span>}
                    </p>
                    <p className="text-xs text-muted">{formatLongDate(d.date)}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

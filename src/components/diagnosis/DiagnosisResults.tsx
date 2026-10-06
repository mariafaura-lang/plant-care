import clsx from 'clsx'
import { AlertTriangle, ChevronDown, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { findCause, LIKELIHOOD_LABELS, likelihood } from '../../lib/diagnosis'
import type { DiagnosisResult } from '../../types'
import { Badge } from '../ui/ui'

function ResultCard({ result, initiallyOpen }: { result: DiagnosisResult; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  const cause = findCause(result.causeId)
  if (!cause) return null
  const level = likelihood(result.probability)
  const percent = Math.round(result.probability * 100)

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full space-y-2 p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{cause.name}</h3>
          <ChevronDown className={clsx('size-5 shrink-0 text-muted transition', open && 'rotate-180')} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={level === 'muy-probable' ? 'warning' : 'neutral'}>{LIKELIHOOD_LABELS[level]}</Badge>
          {cause.urgency === 'alta' && (
            <Badge tone="danger">
              <AlertTriangle className="size-3" /> Actúa pronto
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2" aria-label={`Probabilidad relativa ${percent} %`}>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <span className="w-10 text-right text-xs text-muted">{percent} %</span>
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-4 pt-3">
          <p className="text-sm text-muted">{cause.summary}</p>
          <div>
            <h4 className="mb-2 text-sm font-semibold">Qué hacer</h4>
            <ol className="space-y-2">
              {cause.treatment.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          {cause.prevention && (
            <p className="flex gap-2 rounded-xl bg-accent-soft p-3 text-sm">
              <ShieldCheck className="size-5 shrink-0 text-accent" />
              <span>
                <span className="font-semibold">Para que no vuelva a pasar: </span>
                {cause.prevention}
              </span>
            </p>
          )}
        </div>
      )}
    </article>
  )
}

/** Causas probables con su tratamiento, de más a menos probable. */
export function DiagnosisResults({ results }: { results: DiagnosisResult[] }) {
  if (results.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-alt p-4 text-sm text-muted">
        Con estos datos no encuentro una causa clara. Revisa la tierra, la luz y el envés de las hojas, y vuelve a intentarlo marcando más
        síntomas.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <ResultCard key={r.causeId} result={r} initiallyOpen={i === 0} />
      ))}
      <p className="text-xs text-muted">
        El porcentaje compara las causas entre sí según tus respuestas; no es una certeza. Si tras 2-3 semanas no mejora, repite el
        diagnóstico o consulta en un vivero.
      </p>
    </div>
  )
}

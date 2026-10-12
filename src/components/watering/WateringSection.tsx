import clsx from 'clsx'
import { ChevronDown, Clock, Droplets, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePlantEvents, useToday } from '../../hooks/useWateringSchedule'
import { useSettings } from '../../hooks/useSettings'
import { addDays, formatLongDate, formatRelativeDay, formatShortDate } from '../../lib/dates'
import { adaptiveSuggestion, plantSchedule, POT_SIZE_FACTOR, POT_TYPE_FACTOR, seasonName } from '../../lib/watering'
import { addPastWatering, deleteWateringEvent, setWateringFactor, snoozePlant, waterPlants } from '../../lib/wateringActions'
import { formatFactor, wateringStatusText } from '../../lib/wateringText'
import { POT_SIZE_LABELS, POT_TYPE_LABELS, type Plant, type Species } from '../../types'
import { useToast } from '../ui/Toast'
import { Button, Card, TextInput } from '../ui/ui'
import { SnoozeSheet } from './SnoozeSheet'

const fmtDays = (n: number) => n.toLocaleString('es', { maximumFractionDigits: 1 })

export function WateringSection({ plant, species }: { plant: Plant; species?: Species }) {
  const events = usePlantEvents(plant.id)
  const { settings } = useSettings()
  const today = useToday()
  const toast = useToast()
  const [snoozing, setSnoozing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pastDate, setPastDate] = useState(addDays(today, -1))
  const [showAllHistory, setShowAllHistory] = useState(false)

  if (!events || !settings) return null

  const entry = plantSchedule(plant, species, events, today, settings.hemisphere)
  const suggestion = dismissed ? null : adaptiveSuggestion(plant, species, events, today, settings.hemisphere)
  const { interval } = entry
  const season = seasonName(entry.lastWatered ?? today, settings.hemisphere)
  const history = showAllHistory ? events : events.slice(0, 8)

  const water = async () => {
    const undo = await waterPlants([plant.id])
    toast.show(`${plant.nickname}: regada 💧`, undo)
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Riego</h2>

      <Card className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              'flex size-12 shrink-0 items-center justify-center rounded-full',
              entry.status === 'atrasada' ? 'bg-danger-soft text-danger' : 'bg-water-soft text-water',
            )}
          >
            <Droplets className="size-6" />
          </div>
          <div className="min-w-0">
            <p className={clsx('font-semibold', entry.status === 'atrasada' && 'text-danger')}>{wateringStatusText(entry, today)}</p>
            <p className="text-sm text-muted">
              {entry.lastWatered
                ? `Próximo riego: ${formatShortDate(entry.due)} · último ${formatRelativeDay(entry.lastWatered, today)}`
                : 'Márcala como regada (o añade un riego pasado) para empezar a calcular.'}
            </p>
            <p className="text-sm text-muted">Cada {interval.days} días ahora ({season})</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="water" className="flex-1" onClick={water}>
            <Droplets className="size-4" /> Regada
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setSnoozing(true)}>
            <Clock className="size-4" /> Más tarde
          </Button>
        </div>

        <button type="button" onClick={() => setShowDetails((v) => !v)} className="flex w-full items-center justify-between text-sm text-muted">
          ¿Cómo se calcula?
          <ChevronDown className={clsx('size-4 transition', showDetails && 'rotate-180')} />
        </button>
        {showDetails && (
          <ul className="space-y-1 rounded-xl bg-surface-alt p-3 text-sm">
            <li>
              {species ? species.commonName : 'Especie desconocida'} en {season}: ~{fmtDays(interval.seasonalBase)} días
              {!species && <span className="text-muted"> (7 en verano, 14 en invierno)</span>}
            </li>
            <li>
              Maceta de {POT_TYPE_LABELS[plant.potType].toLowerCase()}: ×{formatFactor(POT_TYPE_FACTOR[plant.potType])}
            </li>
            <li>
              Tamaño {POT_SIZE_LABELS[plant.potSize].split(' ')[0].toLowerCase()}: ×{formatFactor(POT_SIZE_FACTOR[plant.potSize])}
            </li>
            {plant.wateringFactor && <li>Tu ajuste personal: ×{formatFactor(plant.wateringFactor)}</li>}
            <li className="border-t border-border pt-1 font-medium">
              = {fmtDays(interval.raw)} → cada {interval.days} días
            </li>
          </ul>
        )}
      </Card>

      {suggestion && (
        <Card className="space-y-3 border-accent/40 bg-accent-soft">
          <div className="flex gap-3">
            <Sparkles className="size-5 shrink-0 text-accent" />
            <p className="text-sm">
              Según tus últimos {suggestion.samples + 1} riegos, sueles regarla <strong>cada ~{suggestion.typicalDays} días</strong>, y la app
              calcula {suggestion.currentDays}. ¿Ajusto el riego a <strong>cada {suggestion.suggestedDays} días</strong> por ahora? Se seguirá
              adaptando a la estación.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDismissed(true)}>
              Ahora no
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                await setWateringFactor(plant.id, suggestion.factor)
                toast.show(`Riego ajustado a cada ${suggestion.suggestedDays} días`)
              }}
            >
              Ajustar
            </Button>
          </div>
        </Card>
      )}

      {plant.wateringFactor && !suggestion && (
        <p className="flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            <Sparkles className="mr-1 inline size-4 text-accent" />
            Ajuste personal activo (×{formatFactor(plant.wateringFactor)})
          </span>
          <button type="button" className="font-medium text-accent" onClick={() => setWateringFactor(plant.id, undefined)}>
            Quitar
          </button>
        </p>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Historial</h3>
        {events.length === 0 && <p className="text-sm text-muted">Todavía no hay riegos registrados.</p>}
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {history.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2">
              {e.kind === 'regada' ? <Droplets className="size-4 text-water" /> : <Clock className="size-4 text-muted" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm">{e.kind === 'regada' ? 'Regada' : `Pospuesta ${e.snoozeDays} ${e.snoozeDays === 1 ? 'día' : 'días'}`}</p>
                <p className="text-xs text-muted">{formatLongDate(e.date)}</p>
              </div>
              <button
                type="button"
                aria-label="Borrar del historial"
                onClick={() => deleteWateringEvent(e.id)}
                className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-alt"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        {events.length > history.length && (
          <button type="button" className="text-sm font-medium text-accent" onClick={() => setShowAllHistory(true)}>
            Ver todo ({events.length})
          </button>
        )}

        <div className="flex items-end gap-2 pt-1">
          <label className="flex-1 space-y-1">
            <span className="text-xs text-muted">¿La regaste otro día?</span>
            <TextInput type="date" value={pastDate} max={today} onChange={(e) => setPastDate(e.target.value)} />
          </label>
          <Button
            variant="secondary"
            disabled={!pastDate || pastDate > today}
            onClick={async () => {
              await addPastWatering(plant.id, pastDate)
              toast.show(`Riego del ${formatShortDate(pastDate)} añadido`)
            }}
          >
            <Plus className="size-4" /> Añadir
          </Button>
        </div>
      </div>

      <SnoozeSheet
        plantName={snoozing ? plant.nickname : undefined}
        onClose={() => setSnoozing(false)}
        onSnooze={async (days) => {
          await snoozePlant(plant.id, days)
          setSnoozing(false)
          toast.show(`Te lo recuerdo ${days === 1 ? 'mañana' : `en ${days} días`}`)
        }}
      />
      {toast.element}
    </section>
  )
}

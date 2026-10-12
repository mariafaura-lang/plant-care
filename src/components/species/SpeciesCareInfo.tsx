import { Droplets, Gauge, PawPrint, Sun, Thermometer, Waves } from 'lucide-react'
import type { ReactNode } from 'react'
import { DIFFICULTY_LABELS, HUMIDITY_LABELS, LIGHT_LABELS, type Species } from '../../types'

function Item({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function ToxicityText({ species }: { species: Species }) {
  if (species.petToxic === null) return <>Desconocida</>
  return <>{species.petToxic ? 'Tóxica' : 'No tóxica'}</>
}

/** Ficha de cuidados de una especie. */
export function SpeciesCareInfo({ species }: { species: Species }) {
  const icon = 'size-5'
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Item icon={<Sun className={icon} />} label="Luz" value={LIGHT_LABELS[species.light]} />
        <Item icon={<Waves className={icon} />} label="Humedad" value={HUMIDITY_LABELS[species.humidity]} />
        <Item icon={<Thermometer className={icon} />} label="Temperatura" value={`${species.tempMin}-${species.tempMax} ºC`} />
        <Item
          icon={<Droplets className={icon} />}
          label="Riego base"
          value={
            <>
              Cada {species.waterDaysSummer} d en verano
              <br />
              Cada {species.waterDaysWinter} d en invierno
            </>
          }
        />
        <Item icon={<Gauge className={icon} />} label="Dificultad" value={DIFFICULTY_LABELS[species.difficulty]} />
        <Item icon={<PawPrint className={icon} />} label="Mascotas" value={<ToxicityText species={species} />} />
      </div>
      {species.toxicityNote && (
        <p
          className={
            species.petToxic ? 'rounded-xl bg-danger-soft p-3 text-sm text-danger' : 'rounded-xl bg-surface-alt p-3 text-sm text-muted'
          }
        >
          <PawPrint className="mr-1 inline size-4" aria-hidden /> {species.toxicityNote}
        </p>
      )}
      <p className="rounded-xl bg-accent-soft p-3 text-sm">
        <span className="font-semibold text-accent">Consejo: </span>
        {species.tip}
      </p>
    </div>
  )
}

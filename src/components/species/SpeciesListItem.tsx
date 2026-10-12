import { PawPrint } from 'lucide-react'
import type { Species } from '../../types'
import { DIFFICULTY_LABELS } from '../../types'
import { Badge } from '../ui/ui'

/** Contenido de una fila de especie (nombre, científico y etiquetas). */
export function SpeciesListItem({ species }: { species: Species }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold">{species.commonName}</p>
      <p className="truncate text-sm text-muted italic">{species.scientificName}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Badge tone={species.difficulty === 'facil' ? 'accent' : species.difficulty === 'dificil' ? 'warning' : 'neutral'}>
          {DIFFICULTY_LABELS[species.difficulty]}
        </Badge>
        {species.petToxic === true && (
          <Badge tone="danger">
            <PawPrint className="size-3" /> Tóxica
          </Badge>
        )}
        {species.petToxic === false && (
          <Badge tone="accent">
            <PawPrint className="size-3" /> Apta mascotas
          </Badge>
        )}
        {species.source === 'plantbook' && <Badge tone="water">Open Plantbook</Badge>}
      </div>
    </div>
  )
}

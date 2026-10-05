import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { SpeciesListItem } from '../components/species/SpeciesListItem'
import { Chip, SearchInput } from '../components/ui/ui'
import { useSpeciesList } from '../hooks/useSpecies'
import { searchSpecies } from '../lib/species'
import type { LightLevel } from '../types'

type Filter = 'mascotas' | 'faciles' | 'poca-luz'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'mascotas', label: 'Aptas para mascotas' },
  { id: 'faciles', label: 'Fáciles' },
  { id: 'poca-luz', label: 'Poca luz' },
]

const LOW_LIGHT: LightLevel[] = ['baja', 'media']

export function CatalogPage() {
  const species = useSpeciesList()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filter[]>([])

  const toggle = (f: Filter) => setFilters((list) => (list.includes(f) ? list.filter((x) => x !== f) : [...list, f]))

  const results = searchSpecies(species, query).filter(
    (s) =>
      (!filters.includes('mascotas') || s.petToxic === false) &&
      (!filters.includes('faciles') || s.difficulty === 'facil') &&
      (!filters.includes('poca-luz') || LOW_LIGHT.includes(s.light)),
  )

  return (
    <>
      <PageHeader title="Catálogo" subtitle={`${species.length} especies`} back="/plantas" />
      <div className="space-y-3 px-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar especie" />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filters.includes(f.id)} onClick={() => toggle(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>

        <ul className="space-y-2">
          {results.map((s) => (
            <li key={s.id}>
              <Link to={`/catalogo/${encodeURIComponent(s.id)}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <SpeciesListItem species={s} />
                <ChevronRight className="size-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p className="py-8 text-center text-sm text-muted">No hay especies que coincidan.</p>}
      </div>
    </>
  )
}

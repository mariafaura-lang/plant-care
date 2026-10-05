import { Check, Globe, HelpCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { db } from '../../db/db'
import { useSettings } from '../../hooks/useSettings'
import { useSpeciesList } from '../../hooks/useSpecies'
import {
  getPlantbookDetail,
  getPlantbookKey,
  PlantbookError,
  plantbookToSpecies,
  searchPlantbook,
  type PlantbookSearchResult,
} from '../../lib/integrations/plantbook'
import { searchSpecies } from '../../lib/species'
import { Button, SearchInput, Sheet } from '../ui/ui'
import { SpeciesListItem } from './SpeciesListItem'

const rowClass = 'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-surface-alt'

/** Hoja para elegir la especie de una planta: catálogo, especies guardadas y (opcional) Open Plantbook. */
export function SpeciesPicker({
  open,
  onClose,
  selectedId,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  selectedId?: string
  onSelect: (speciesId: string | undefined) => void
}) {
  const species = useSpeciesList()
  const { settings } = useSettings()
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<PlantbookSearchResult[]>()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string>()

  const apiKey = getPlantbookKey(settings)
  const results = searchSpecies(species, query)

  const choose = (id: string | undefined) => {
    onSelect(id)
    onClose()
  }

  const runRemoteSearch = async () => {
    if (!apiKey || !query.trim()) return
    setLoading('search')
    setError(undefined)
    try {
      setRemote(await searchPlantbook(query.trim(), apiKey))
    } catch (e) {
      setError(e instanceof PlantbookError ? e.message : 'Error inesperado al buscar en Open Plantbook.')
    } finally {
      setLoading(null)
    }
  }

  const chooseRemote = async (result: PlantbookSearchResult) => {
    if (!apiKey) return
    setLoading(result.pid)
    setError(undefined)
    try {
      const detail = await getPlantbookDetail(result.pid, apiKey)
      const sp = plantbookToSpecies(detail)
      await db.customSpecies.put(sp)
      choose(sp.id)
    } catch (e) {
      setError(e instanceof PlantbookError ? e.message : 'No se pudo descargar la ficha de la especie.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Elegir especie">
      <div className="space-y-3">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setRemote(undefined)
          }}
          placeholder="Buscar: monstera, potus, cactus…"
        />

        <button type="button" className={rowClass} onClick={() => choose(undefined)}>
          <HelpCircle className="size-5 text-muted" />
          <span className="flex-1">No sé la especie</span>
          {!selectedId && <Check className="size-5 text-accent" />}
        </button>

        <ul className="space-y-1">
          {results.map((s) => (
            <li key={s.id}>
              <button type="button" className={rowClass} onClick={() => choose(s.id)}>
                <SpeciesListItem species={s} />
                {selectedId === s.id && <Check className="size-5 shrink-0 text-accent" />}
              </button>
            </li>
          ))}
        </ul>

        {results.length === 0 && <p className="text-center text-sm text-muted">No está en el catálogo.</p>}

        {/* Búsqueda opcional en Open Plantbook */}
        {apiKey ? (
          query.trim() && (
            <div className="space-y-2 border-t border-border pt-3">
              <Button variant="secondary" className="w-full" onClick={runRemoteSearch} disabled={loading !== null}>
                {loading === 'search' ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                Buscar «{query.trim()}» en Open Plantbook
              </Button>
              {remote?.length === 0 && <p className="text-center text-sm text-muted">Open Plantbook no tiene resultados.</p>}
              <ul className="space-y-1">
                {remote?.map((r) => (
                  <li key={r.pid}>
                    <button type="button" className={rowClass} onClick={() => chooseRemote(r)} disabled={loading !== null}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.display_pid}</p>
                        <p className="truncate text-sm text-muted">{r.alias}</p>
                      </div>
                      {loading === r.pid && <Loader2 className="size-5 animate-spin text-muted" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <p className="border-t border-border pt-3 text-center text-xs text-muted">
            ¿No encuentras tu planta? Puedes activar la búsqueda en Open Plantbook (gratis) desde Ajustes.
          </p>
        )}
        {error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  )
}

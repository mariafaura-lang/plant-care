import catalogData from '../data/species.json'
import type { Species } from '../types'

/** Catálogo incluido en la app (src/data/species.json). */
export const CATALOG: Species[] = (catalogData as Species[]).map((s) => ({ ...s, source: 'catalogo' as const }))

/** Minúsculas y sin tildes, para buscar "calatea" y encontrar "Calathea", o "arbol" y encontrar "Árbol". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function speciesNames(species: Species): string[] {
  return [species.commonName, species.scientificName, ...(species.otherNames ?? [])].map(normalizeText)
}

/**
 * Busca especies por nombre común, científico u otros nombres.
 * Ordena primero las que empiezan por el texto buscado y después las que lo contienen.
 */
export function searchSpecies(list: Species[], query: string): Species[] {
  const q = normalizeText(query)
  const byName = (a: Species, b: Species) => a.commonName.localeCompare(b.commonName, 'es')
  if (!q) return [...list].sort(byName)

  const rank = (s: Species) => {
    const names = speciesNames(s)
    if (names.some((n) => n.startsWith(q))) return 0
    if (names.some((n) => n.split(/[\s-]+/).some((word) => word.startsWith(q)))) return 1
    if (names.some((n) => n.includes(q))) return 2
    return -1
  }

  return list
    .map((s) => ({ s, r: rank(s) }))
    .filter(({ r }) => r >= 0)
    .sort((a, b) => a.r - b.r || byName(a.s, b.s))
    .map(({ s }) => s)
}

export function findSpecies(id: string | undefined, list: Species[]): Species | undefined {
  if (!id) return undefined
  return list.find((s) => s.id === id)
}

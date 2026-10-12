import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db } from '../db/db'
import { CATALOG } from '../lib/species'
import type { Species } from '../types'

/** Catálogo incluido + especies propias o de Open Plantbook guardadas en el dispositivo. */
export function useSpeciesList(): Species[] {
  const custom = useLiveQuery(() => db.customSpecies.toArray(), [])
  return useMemo(() => [...CATALOG, ...(custom ?? [])], [custom])
}

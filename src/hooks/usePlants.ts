import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Todas las plantas (se actualiza solo). `undefined` mientras carga. */
export function usePlants() {
  return useLiveQuery(() => db.plants.toArray(), [])
}

/** Una planta por id. `undefined` mientras carga, `null` si no existe. */
export function usePlant(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await db.plants.get(id)) ?? null) : null), [id])
}

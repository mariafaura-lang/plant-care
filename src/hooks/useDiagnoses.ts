import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Diagnósticos de una planta, del más reciente al más antiguo. */
export function usePlantDiagnoses(plantId: string | undefined) {
  return useLiveQuery(async () => (plantId ? (await db.diagnoses.where('plantId').equals(plantId).sortBy('date')).reverse() : []), [plantId])
}

/** Un diagnóstico por id. `undefined` mientras carga, `null` si no existe. */
export function useDiagnosis(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await db.diagnoses.get(id)) ?? null) : null), [id])
}

import { db } from '../db/db'
import { DEFAULT_SETTINGS, type Settings } from '../types'

/** Lee todos los ajustes, rellenando con los valores por defecto lo que falte. */
export async function loadSettings(database = db): Promise<Settings> {
  const rows = await database.settings.toArray()
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<Settings>
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K], database = db) {
  await database.settings.put({ key, value })
}

import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { loadSettings, saveSetting } from '../lib/settings'
import type { Settings } from '../types'

/** Ajustes reactivos: se actualizan solos al cambiar en la base de datos. */
export function useSettings() {
  const settings = useLiveQuery(() => loadSettings(), [])
  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => saveSetting(key, value), [])
  return { settings, update }
}

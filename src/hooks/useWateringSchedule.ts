import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../db/db'
import { today as getToday } from '../lib/dates'
import { buildSchedule } from '../lib/watering'
import { usePlants } from './usePlants'
import { useSettings } from './useSettings'
import { useSpeciesList } from './useSpecies'

/** "Hoy" que se actualiza solo al pasar la medianoche o al volver a la app. */
export function useToday() {
  const [day, setDay] = useState(getToday)
  useEffect(() => {
    const refresh = () => setDay(getToday())
    const timer = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return day
}

/** Calendario de riego de todas las plantas. `undefined` mientras carga. */
export function useWateringSchedule() {
  const plants = usePlants()
  const species = useSpeciesList()
  const events = useLiveQuery(() => db.wateringEvents.toArray(), [])
  const { settings } = useSettings()
  const today = useToday()

  const schedule = useMemo(
    () => (plants && events && settings ? buildSchedule(plants, species, events, today, settings.hemisphere) : undefined),
    [plants, species, events, settings, today],
  )
  return { schedule, settings, today }
}

/** Riegos de una planta, del más reciente al más antiguo. */
export function usePlantEvents(plantId: string | undefined) {
  return useLiveQuery(
    async () => (plantId ? (await db.wateringEvents.where('plantId').equals(plantId).sortBy('date')).reverse() : []),
    [plantId],
  )
}

import { db, type PlantDB } from '../db/db'
import type { ISODate } from '../types'
import { addDays, parseISODate, today } from './dates'
import { newId } from './ids'
import { MAX_FACTOR, MIN_FACTOR } from './watering'

/**
 * Marca una o varias plantas como regadas (por defecto, ahora) y anula cualquier "Más tarde".
 * Devuelve una función para deshacerlo.
 */
export async function waterPlants(plantIds: string[], when: Date = new Date(), database: PlantDB = db): Promise<() => Promise<void>> {
  const date = when.toISOString()
  const events = plantIds.map((plantId) => ({ id: newId(), plantId, date, kind: 'regada' as const }))
  const previous = await database.plants.bulkGet(plantIds)
  await database.transaction('rw', database.plants, database.wateringEvents, async () => {
    await database.wateringEvents.bulkAdd(events)
    for (const id of plantIds) await database.plants.update(id, { snoozedUntil: undefined })
  })
  return async () => {
    await database.transaction('rw', database.plants, database.wateringEvents, async () => {
      await database.wateringEvents.bulkDelete(events.map((e) => e.id))
      for (const plant of previous) if (plant?.snoozedUntil) await database.plants.update(plant.id, { snoozedUntil: plant.snoozedUntil })
    })
  }
}

/** Registra un riego de un día pasado (a mediodía, para evitar líos de zona horaria). */
export async function addPastWatering(plantId: string, day: ISODate, database: PlantDB = db) {
  const when = parseISODate(day)
  when.setHours(12)
  await database.wateringEvents.add({ id: newId(), plantId, date: when.toISOString(), kind: 'regada' })
}

/** "Más tarde": la tierra sigue húmeda, volver a preguntar dentro de 1-3 días. */
export async function snoozePlant(plantId: string, days: number, now: Date = new Date(), database: PlantDB = db) {
  const snoozeDays = Math.min(3, Math.max(1, Math.round(days)))
  await database.transaction('rw', database.plants, database.wateringEvents, async () => {
    await database.plants.update(plantId, { snoozedUntil: addDays(today(now), snoozeDays) })
    await database.wateringEvents.add({ id: newId(), plantId, date: now.toISOString(), kind: 'pospuesta', snoozeDays })
  })
}

export async function deleteWateringEvent(eventId: string, database: PlantDB = db) {
  await database.wateringEvents.delete(eventId)
}

/** Acepta (o, con `undefined`, quita) el ajuste personal sugerido por el riego adaptativo. */
export async function setWateringFactor(plantId: string, factor: number | undefined, database: PlantDB = db) {
  const value = factor === undefined ? undefined : Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, factor))
  await database.plants.update(plantId, { wateringFactor: value, updatedAt: new Date().toISOString() })
}

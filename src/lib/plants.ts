import { db, type PlantDB } from '../db/db'
import type { Plant, Species } from '../types'
import { newId } from './ids'
import { normalizeText } from './species'

export type PlantInput = Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>

export const DEFAULT_ROOMS = ['Salón', 'Dormitorio', 'Cocina', 'Baño', 'Despacho', 'Terraza']

export async function createPlant(input: PlantInput, database: PlantDB = db): Promise<string> {
  const now = new Date().toISOString()
  const id = newId()
  await database.plants.add({ ...cleanInput(input), id, createdAt: now, updatedAt: now })
  return id
}

export async function updatePlant(id: string, input: PlantInput, database: PlantDB = db): Promise<void> {
  const existing = await database.plants.get(id)
  if (!existing) throw new Error('La planta no existe')
  // put (no update) para que los campos vaciados en el formulario se borren de verdad.
  await database.plants.put({
    ...cleanInput(input),
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    // Estos campos no se editan desde el formulario: se conservan.
    snoozedUntil: existing.snoozedUntil,
    intervalOverride: input.intervalOverride ?? existing.intervalOverride,
  })
}

/** Borra la planta junto con su historial de riegos y diagnósticos. */
export async function deletePlant(id: string, database: PlantDB = db): Promise<void> {
  await database.transaction('rw', database.plants, database.wateringEvents, database.diagnoses, async () => {
    await database.wateringEvents.where('plantId').equals(id).delete()
    await database.diagnoses.where('plantId').equals(id).delete()
    await database.plants.delete(id)
  })
}

function cleanInput(input: PlantInput): PlantInput {
  const result: PlantInput = {
    ...input,
    nickname: input.nickname.trim(),
    room: input.room.trim() || 'Sin habitación',
    notes: input.notes?.trim() || undefined,
    purchaseDate: input.purchaseDate || undefined,
    speciesId: input.speciesId || undefined,
  }
  // Dexie guarda las claves con valor undefined; las quitamos para que el JSON exportado quede limpio.
  for (const key of Object.keys(result) as (keyof PlantInput)[]) {
    if (result[key] === undefined) delete result[key]
  }
  return result
}

/** Filtra por apodo, habitación, notas o nombre de la especie (sin tildes ni mayúsculas). */
export function filterPlants(plants: Plant[], query: string, species: Species[]): Plant[] {
  const q = normalizeText(query)
  if (!q) return plants
  const speciesById = new Map(species.map((s) => [s.id, s]))
  return plants.filter((p) => {
    const sp = p.speciesId ? speciesById.get(p.speciesId) : undefined
    const haystack = [p.nickname, p.room, p.notes ?? '', sp?.commonName ?? '', sp?.scientificName ?? '', ...(sp?.otherNames ?? [])]
    return haystack.some((text) => normalizeText(text).includes(q))
  })
}

export interface RoomGroup {
  room: string
  plants: Plant[]
}

/** Agrupa por habitación (orden alfabético) y ordena cada grupo por apodo. */
export function groupByRoom(plants: Plant[]): RoomGroup[] {
  const groups = new Map<string, Plant[]>()
  for (const plant of plants) {
    const list = groups.get(plant.room) ?? []
    list.push(plant)
    groups.set(plant.room, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([room, list]) => ({ room, plants: list.sort((a, b) => a.nickname.localeCompare(b.nickname, 'es')) }))
}

/** Habitaciones ya usadas + las habituales, sin duplicados, para sugerir en el formulario. */
export function roomSuggestions(plants: Plant[]): string[] {
  const used = plants.map((p) => p.room)
  const seen = new Set<string>()
  return [...used, ...DEFAULT_ROOMS].filter((room) => {
    const key = normalizeText(room)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

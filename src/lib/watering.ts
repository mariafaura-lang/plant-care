import type { Hemisphere, ISODate, Plant, PotSize, PotType, Species, WateringEvent } from '../types'
import { addDays, dayOf, diffDays, parseISODate } from './dates'

// Cálculo del riego. Todo son funciones puras: reciben "hoy" como parámetro
// para que los tests sean deterministas.
//
//   intervalo = base(estación) × maceta × tamaño × ajuste personal
//   próximo riego = último riego + intervalo (o la fecha de "Más tarde" si es posterior)

/** El barro transpira y seca antes la tierra; el plástico la mantiene húmeda más tiempo. */
export const POT_TYPE_FACTOR: Record<PotType, number> = { barro: 0.8, plastico: 1.1, ceramica: 1 }
/** Las macetas pequeñas tienen poca tierra y se secan antes. */
export const POT_SIZE_FACTOR: Record<PotSize, number> = { pequena: 0.8, mediana: 1, grande: 1.25 }
/** Riego por defecto si no se sabe la especie. */
export const FALLBACK_WATERING = { waterDaysSummer: 7, waterDaysWinter: 14 }

export const MIN_INTERVAL = 1
export const MAX_INTERVAL = 60
export const UPCOMING_DAYS = 7
export const MIN_WATERINGS_FOR_SUGGESTION = 3
export const MIN_FACTOR = 0.4
export const MAX_FACTOR = 2.5

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// ─── Estación ────────────────────────────────────────────────────────────────

/**
 * Cuánto "verano" hay en una fecha: 0 a mediados de enero (pleno invierno en
 * el hemisferio norte), 1 a mediados de julio. Sigue una curva suave, así en
 * primavera y otoño el intervalo queda entre el de verano y el de invierno.
 */
export function summerWeight(date: ISODate, hemisphere: Hemisphere): number {
  const d = parseISODate(date)
  const dayOfYear = diffDays(`${d.getFullYear()}-01-01`, date)
  const shifted = hemisphere === 'norte' ? dayOfYear : dayOfYear + 365.25 / 2
  return (1 - Math.cos((2 * Math.PI * (shifted - 15)) / 365.25)) / 2
}

export type SeasonName = 'primavera' | 'verano' | 'otoño' | 'invierno'

export function seasonName(date: ISODate, hemisphere: Hemisphere): SeasonName {
  const month = parseISODate(date).getMonth() // 0 = enero
  const north: SeasonName[] = ['invierno', 'primavera', 'verano', 'otoño']
  const index = Math.floor(((month + 1) % 12) / 3) // dic-feb → 0, mar-may → 1…
  return north[hemisphere === 'norte' ? index : (index + 2) % 4]
}

// ─── Intervalo ───────────────────────────────────────────────────────────────

export interface IntervalBreakdown {
  /** Intervalo de la especie para esta época del año (días, sin redondear). */
  seasonalBase: number
  potTypeFactor: number
  potSizeFactor: number
  personalFactor: number
  /** Resultado sin redondear. */
  raw: number
  /** Resultado final en días enteros. */
  days: number
}

type WateringSpecies = Pick<Species, 'waterDaysSummer' | 'waterDaysWinter'>
type WateringPlant = Pick<Plant, 'potType' | 'potSize' | 'wateringFactor'>

export function wateringInterval(
  plant: WateringPlant,
  species: WateringSpecies | undefined,
  date: ISODate,
  hemisphere: Hemisphere,
): IntervalBreakdown {
  const sp = species ?? FALLBACK_WATERING
  const w = summerWeight(date, hemisphere)
  const seasonalBase = sp.waterDaysWinter + (sp.waterDaysSummer - sp.waterDaysWinter) * w
  const potTypeFactor = POT_TYPE_FACTOR[plant.potType]
  const potSizeFactor = POT_SIZE_FACTOR[plant.potSize]
  const personalFactor = plant.wateringFactor ?? 1
  const raw = seasonalBase * potTypeFactor * potSizeFactor * personalFactor
  return { seasonalBase, potTypeFactor, potSizeFactor, personalFactor, raw, days: clamp(Math.round(raw), MIN_INTERVAL, MAX_INTERVAL) }
}

// ─── Próximo riego ───────────────────────────────────────────────────────────

export type WateringStatus = 'atrasada' | 'hoy' | 'proxima' | 'mas-adelante'

export interface PlantSchedule {
  plant: Plant
  species?: Species
  /** Día del último riego, si hay alguno registrado. */
  lastWatered?: ISODate
  interval: IntervalBreakdown
  /** Día en que toca regar. */
  due: ISODate
  /** Días desde hoy hasta `due` (negativo si va atrasada). */
  daysUntil: number
  status: WateringStatus
  /** Pospuesta con "Más tarde" y aún sin regar. */
  snoozed: boolean
}

/** Días (sin repetir y ordenados) en que se regó la planta. */
export function wateredDays(events: WateringEvent[]): ISODate[] {
  return [...new Set(events.filter((e) => e.kind === 'regada').map((e) => dayOf(e.date)))].sort()
}

export function statusFor(daysUntil: number): WateringStatus {
  if (daysUntil < 0) return 'atrasada'
  if (daysUntil === 0) return 'hoy'
  if (daysUntil <= UPCOMING_DAYS) return 'proxima'
  return 'mas-adelante'
}

export function plantSchedule(
  plant: Plant,
  species: Species | undefined,
  events: WateringEvent[],
  today: ISODate,
  hemisphere: Hemisphere,
): PlantSchedule {
  const lastWatered = wateredDays(events).at(-1)
  const interval = wateringInterval(plant, species, lastWatered ?? today, hemisphere)
  // Sin ningún riego registrado, toca hoy: así la app pide un primer riego y empieza a contar.
  let due = lastWatered ? addDays(lastWatered, interval.days) : today
  const snoozed = !!plant.snoozedUntil && plant.snoozedUntil > due
  if (snoozed) due = plant.snoozedUntil!
  const daysUntil = diffDays(today, due)
  return { plant, species, lastWatered, interval, due, daysUntil, status: statusFor(daysUntil), snoozed }
}

/** Calendario de todas las plantas, ordenado por urgencia. */
export function buildSchedule(
  plants: Plant[],
  species: Species[],
  events: WateringEvent[],
  today: ISODate,
  hemisphere: Hemisphere,
): PlantSchedule[] {
  const speciesById = new Map(species.map((s) => [s.id, s]))
  const eventsByPlant = new Map<string, WateringEvent[]>()
  for (const e of events) {
    const list = eventsByPlant.get(e.plantId) ?? []
    list.push(e)
    eventsByPlant.set(e.plantId, list)
  }
  return plants
    .map((p) => plantSchedule(p, p.speciesId ? speciesById.get(p.speciesId) : undefined, eventsByPlant.get(p.id) ?? [], today, hemisphere))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.plant.nickname.localeCompare(b.plant.nickname, 'es'))
}

export interface ScheduleGroups {
  overdue: PlantSchedule[]
  today: PlantSchedule[]
  /** Próximos 7 días, agrupados por día. */
  upcoming: { day: ISODate; entries: PlantSchedule[] }[]
}

export function groupSchedule(schedule: PlantSchedule[]): ScheduleGroups {
  const upcoming = new Map<ISODate, PlantSchedule[]>()
  for (const entry of schedule.filter((e) => e.status === 'proxima')) {
    upcoming.set(entry.due, [...(upcoming.get(entry.due) ?? []), entry])
  }
  return {
    overdue: schedule.filter((e) => e.status === 'atrasada'),
    today: schedule.filter((e) => e.status === 'hoy'),
    upcoming: [...upcoming.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, entries]) => ({ day, entries })),
  }
}

// ─── Riego adaptativo ────────────────────────────────────────────────────────

export interface AdaptiveSuggestion {
  /** Ajuste personal propuesto (multiplica el intervalo calculado). */
  factor: number
  /** Cada cuántos días riegas de verdad (mediana). */
  typicalDays: number
  /** Intervalo que calcula la app ahora mismo. */
  currentDays: number
  /** Intervalo que quedaría ahora mismo si se acepta. */
  suggestedDays: number
  /** Cuántos intervalos reales se han usado. */
  samples: number
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Con 3 o más riegos registrados, compara cada intervalo real con el que
 * calculaba la app en esa fecha (sin ajuste personal) y propone un factor.
 * Al comparar proporciones, un intervalo de verano y otro de invierno pesan
 * igual. Usa los últimos 8 intervalos y la mediana, para que unas vacaciones
 * no lo descoloquen. Solo sugiere si el cambio es de más del 20 % y cambia
 * el número de días.
 */
export function adaptiveSuggestion(
  plant: Plant,
  species: Species | undefined,
  events: WateringEvent[],
  today: ISODate,
  hemisphere: Hemisphere,
): AdaptiveSuggestion | null {
  const days = wateredDays(events).slice(-9)
  if (days.length < MIN_WATERINGS_FOR_SUGGESTION) return null

  const neutralPlant = { ...plant, wateringFactor: 1 }
  const ratios: number[] = []
  const gaps: number[] = []
  for (let i = 1; i < days.length; i++) {
    const gap = diffDays(days[i - 1], days[i])
    const expected = wateringInterval(neutralPlant, species, days[i - 1], hemisphere).raw
    ratios.push(gap / expected)
    gaps.push(gap)
  }

  const factor = Math.round(clamp(median(ratios), MIN_FACTOR, MAX_FACTOR) * 100) / 100
  const current = plant.wateringFactor ?? 1
  if (Math.abs(factor - current) / current < 0.2) return null

  const currentDays = wateringInterval(plant, species, today, hemisphere).days
  const suggestedDays = wateringInterval({ ...plant, wateringFactor: factor }, species, today, hemisphere).days
  if (suggestedDays === currentDays) return null

  return { factor, typicalDays: Math.round(median(gaps)), currentDays, suggestedDays, samples: gaps.length }
}

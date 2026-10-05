import type { ISODate } from '../types'
import { formatRelativeDay } from './dates'
import type { PlantSchedule } from './watering'

/** Texto corto del estado de riego: "Atrasada 2 días", "Toca hoy", "Regar mañana"… */
export function wateringStatusText(entry: PlantSchedule, today: ISODate): string {
  const { status, daysUntil, lastWatered, snoozed } = entry
  if (!lastWatered && status === 'hoy') return 'Sin riegos registrados'
  if (status === 'atrasada') return `Atrasada ${-daysUntil} ${daysUntil === -1 ? 'día' : 'días'}`
  if (status === 'hoy') return snoozed ? 'Pospuesta hasta hoy' : 'Toca hoy'
  return `Regar ${formatRelativeDay(entry.due, today)}${snoozed ? ' (pospuesta)' : ''}`
}

/** 0.57 → "0,57" */
export const formatFactor = (n: number) => n.toLocaleString('es', { maximumFractionDigits: 2 })

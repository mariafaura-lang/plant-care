import type { ISODate } from '../types'

// Utilidades de fecha sin dependencias. Trabajamos con días locales
// ('YYYY-MM-DD') para que "hoy" sea el hoy del usuario, no el de UTC.

const pad = (n: number) => String(n).padStart(2, '0')

/** Convierte una fecha a 'YYYY-MM-DD' en hora local. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Parsea 'YYYY-MM-DD' (o un ISO completo) como medianoche local de ese día. */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Día local de un instante ISO completo. */
export function dayOf(isoDateTime: string): ISODate {
  return toISODate(new Date(isoDateTime))
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = parseISODate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Días enteros de `from` a `to` (positivo si `to` es posterior). Inmune a cambios de hora. */
export function diffDays(from: ISODate, to: ISODate): number {
  const a = parseISODate(from)
  const b = parseISODate(to)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86_400_000)
}

export function today(now: Date = new Date()): ISODate {
  return toISODate(now)
}

const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const longFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
const shortFormatter = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' })

/** "hoy", "mañana", "hace 3 días"… */
export function formatRelativeDay(date: ISODate, reference: ISODate = today()): string {
  return relativeFormatter.format(diffDays(reference, date), 'day')
}

/** "5 de octubre de 2026" */
export function formatLongDate(date: string): string {
  return longFormatter.format(parseISODate(date))
}

/** "lun, 5 oct" */
export function formatShortDate(date: string): string {
  return shortFormatter.format(parseISODate(date))
}

import type { ISODate, Settings } from '../types'
import type { PlantSchedule } from './watering'

// Lógica pura del aviso diario (sin APIs del navegador), compartida por la app y el service worker.

/** ¿Toca mostrar el aviso de hoy? */
export function shouldNotify(
  settings: Pick<Settings, 'notificationsEnabled' | 'notificationHour' | 'lastNotifiedDay'>,
  now: Date,
  today: ISODate,
  pendingCount: number,
): boolean {
  return settings.notificationsEnabled && pendingCount > 0 && settings.lastNotifiedDay !== today && now.getHours() >= settings.notificationHour
}

/** Texto del aviso a partir de las plantas pendientes (de hoy o atrasadas). */
export function notificationMessage(pending: PlantSchedule[]): { title: string; body: string } {
  const names = pending.map((e) => e.plant.nickname)
  const title = pending.length === 1 ? `Hoy toca regar a ${names[0]}` : `Hoy toca regar ${pending.length} plantas`
  const overdue = pending.filter((e) => e.status === 'atrasada').length
  const list = names.length <= 4 ? names.join(', ') : `${names.slice(0, 3).join(', ')} y ${names.length - 3} más`
  const body = pending.length === 1 ? (overdue ? 'Va con retraso 💧' : 'Toca para abrir la app 💧') : `${list}${overdue ? ` (${overdue} con retraso)` : ''} 💧`
  return { title, body }
}

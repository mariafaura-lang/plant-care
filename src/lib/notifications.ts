import type { ISODate, Settings } from '../types'
import type { PlantSchedule } from './watering'

// Avisos del navegador. Sin servidor no hay "push" real: el aviso se lanza al
// abrir la app (o al volver a ella) a partir de la hora elegida, una vez al día.
// En la fase 5, el service worker lo intentará también en segundo plano donde
// el navegador lo permita (Periodic Background Sync en Chrome/Android).

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission(): NotificationPermission | 'no-soportado' {
  return notificationsSupported() ? Notification.permission : 'no-soportado'
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'no-soportado'> {
  if (!notificationsSupported()) return 'no-soportado'
  return Notification.requestPermission()
}

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

/** Muestra el aviso (a través del service worker si hay, que es lo que funciona en Android). */
export async function showNotification(title: string, body: string) {
  if (notificationPermission() !== 'granted') return false
  const options: NotificationOptions = { body, icon: './favicon.svg', badge: './favicon.svg', tag: 'riego-diario' }
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) await registration.showNotification(title, options)
  else new Notification(title, options)
  return true
}

export { notificationMessage, shouldNotify } from './reminderText'

// Avisos del navegador. Sin servidor no hay "push" real: el aviso se lanza al
// abrir la app (o al volver a ella) a partir de la hora elegida, una vez al día.
// El service worker (src/sw.ts) lo intenta también en segundo plano donde el
// navegador lo permite (Periodic Background Sync en Chrome/Android).

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission(): NotificationPermission | 'no-soportado' {
  return notificationsSupported() ? Notification.permission : 'no-soportado'
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'no-soportado'> {
  if (!notificationsSupported()) return 'no-soportado'
  return Notification.requestPermission()
}

/** Muestra el aviso (a través del service worker si hay, que es lo que funciona en Android). Devuelve si se pudo mostrar. */
export async function showNotification(title: string, body: string): Promise<boolean> {
  if (notificationPermission() !== 'granted') return false
  const options: NotificationOptions = { body, icon: './pwa-192x192.png', badge: './favicon.svg', tag: 'riego-diario' }
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return true
    }
  } catch {
    // Algunos navegadores no dejan mostrarlo desde el service worker: probamos directamente.
  }
  try {
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

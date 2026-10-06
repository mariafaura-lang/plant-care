/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { REMINDER_SYNC_TAG, runDailyReminder } from './lib/dailyReminder'

// Service worker de la app:
//  · guarda la app en caché para que funcione sin conexión;
//  · lanza el aviso diario de riego en segundo plano donde el navegador
//    permite Periodic Background Sync (Chrome en Android, con la app instalada);
//  · al tocar el aviso, abre la app.

declare const self: ServiceWorkerGlobalScope

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Actualización automática: la versión nueva toma el control enseguida.
self.skipWaiting()
clientsClaim()

async function show(title: string, body: string): Promise<boolean> {
  if (Notification.permission !== 'granted') return false
  await self.registration.showNotification(title, { body, icon: 'pwa-192x192.png', badge: 'favicon.svg', tag: 'riego-diario' })
  return true
}

self.addEventListener('periodicsync', (event) => {
  const e = event as PeriodicSyncEvent
  if (e.tag === REMINDER_SYNC_TAG) e.waitUntil(runDailyReminder(show))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows[0]) return windows[0].focus()
      return self.clients.openWindow(self.registration.scope)
    })(),
  )
})

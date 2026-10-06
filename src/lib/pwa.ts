import { useSyncExternalStore } from 'react'
import { REMINDER_SYNC_TAG } from './dailyReminder'

// ─── Instalar la app ─────────────────────────────────────────────────────────
// Chrome/Edge en Android y escritorio lanzan `beforeinstallprompt` al cargar:
// lo guardamos para mostrar un botón "Instalar" en Ajustes. Safari (iPhone) no
// lo tiene: allí se instala con Compartir → Añadir a pantalla de inicio.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Llamar al arrancar (antes de pintar), para no perder el evento. */
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => deferredPrompt !== null,
  )
  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
  }
  return { canInstall, install, installed: isStandalone() }
}

// ─── Aviso en segundo plano ──────────────────────────────────────────────────

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>
  unregister(tag: string): Promise<void>
}

/**
 * Pide al navegador que despierte el service worker de vez en cuando para
 * comprobar si hay que avisar. Solo existe en Chrome (Android) con la app
 * instalada; en el resto no hace nada.
 */
export async function setBackgroundReminder(enabled: boolean) {
  try {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    const periodicSync = (registration as ServiceWorkerRegistration & { periodicSync?: PeriodicSyncManager }).periodicSync
    if (!periodicSync) return
    if (!enabled) return await periodicSync.unregister(REMINDER_SYNC_TAG)
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
    if (status.state === 'granted') await periodicSync.register(REMINDER_SYNC_TAG, { minInterval: 4 * 60 * 60 * 1000 })
  } catch {
    // No soportado: queda el aviso al abrir la app.
  }
}

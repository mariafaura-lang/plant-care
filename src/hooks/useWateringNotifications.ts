import { useEffect } from 'react'
import { runDailyReminder } from '../lib/dailyReminder'
import { showNotification } from '../lib/notifications'
import { setBackgroundReminder } from '../lib/pwa'
import { useSettings } from './useSettings'

/**
 * Aviso diario de riego mientras la app está abierta: al abrirla, al volver a
 * ella y cada 15 minutos (por si se cruza la hora elegida). Además activa el
 * aviso en segundo plano donde el navegador lo permite.
 */
export function useWateringNotifications() {
  const { settings } = useSettings()
  const enabled = settings?.notificationsEnabled ?? false

  useEffect(() => {
    setBackgroundReminder(enabled)
    if (!enabled) return
    const check = () => void runDailyReminder(showNotification)
    check()
    const timer = setInterval(check, 15 * 60_000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, settings?.notificationHour, settings?.hemisphere])
}

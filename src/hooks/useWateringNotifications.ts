import { useEffect } from 'react'
import { notificationMessage, shouldNotify, showNotification } from '../lib/notifications'
import { saveSetting } from '../lib/settings'
import { useWateringSchedule } from './useWateringSchedule'

/**
 * Lanza el aviso diario de riego mientras la app está abierta: al abrirla, al
 * volver a ella y cada 15 minutos (por si se cruza la hora elegida).
 */
export function useWateringNotifications() {
  const { schedule, settings, today } = useWateringSchedule()

  useEffect(() => {
    if (!schedule || !settings) return
    const check = async () => {
      const pending = schedule.filter((e) => e.status === 'atrasada' || e.status === 'hoy')
      if (!shouldNotify(settings, new Date(), today, pending.length)) return
      const { title, body } = notificationMessage(pending)
      if (await showNotification(title, body)) await saveSetting('lastNotifiedDay', today)
    }
    check()
    const timer = setInterval(check, 15 * 60_000)
    return () => clearInterval(timer)
  }, [schedule, settings, today])
}

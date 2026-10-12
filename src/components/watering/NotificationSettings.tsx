import { BellOff, BellRing } from 'lucide-react'
import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { notificationPermission, requestNotificationPermission, showNotification } from '../../lib/notifications'
import { Button } from '../ui/ui'

/** Activar/desactivar el aviso diario y elegir la hora. */
export function NotificationSettings() {
  const { settings, update } = useSettings()
  const [permission, setPermission] = useState(notificationPermission)

  if (!settings) return null

  if (permission === 'no-soportado') {
    return (
      <p className="text-sm text-muted">
        Este navegador no permite avisos. En iPhone funcionan si instalas la app en la pantalla de inicio (Compartir → Añadir a pantalla de
        inicio) con iOS 16.4 o posterior.
      </p>
    )
  }

  const enable = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      await update('notificationsEnabled', true)
      await showNotification('¡Avisos activados! 🌿', 'Te avisaré los días que toque regar.')
    }
  }

  const enabled = settings.notificationsEnabled && permission === 'granted'

  return (
    <div className="space-y-3">
      {permission === 'denied' && (
        <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
          Has bloqueado los avisos para esta app. Puedes permitirlos desde los ajustes del navegador (icono del candado junto a la dirección).
        </p>
      )}

      {enabled ? (
        <>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Avisarme a partir de las</span>
            <select
              value={settings.notificationHour}
              onChange={(e) => update('notificationHour', Number(e.target.value))}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-base"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary" className="w-full" onClick={() => update('notificationsEnabled', false)}>
            <BellOff className="size-4" /> Desactivar avisos
          </Button>
        </>
      ) : (
        <Button className="w-full" onClick={enable} disabled={permission === 'denied'}>
          <BellRing className="size-4" /> Activar avisos de riego
        </Button>
      )}
      <p className="text-xs text-muted">
        Como la app no tiene servidor, el aviso salta al abrirla (o mientras la tienes abierta) a partir de esa hora, una vez al día. Para
        recordatorios aunque no la abras, exporta el calendario de abajo.
      </p>
    </div>
  )
}

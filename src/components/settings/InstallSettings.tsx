import { CheckCircle2, Download, Share } from 'lucide-react'
import { isIOS, useInstallPrompt } from '../../lib/pwa'
import { Button } from '../ui/ui'

/** Instalar la app en la pantalla de inicio (y que funcione sin conexión). */
export function InstallSettings() {
  const { canInstall, install, installed } = useInstallPrompt()

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm text-accent">
        <CheckCircle2 className="size-5" /> La app está instalada en este dispositivo.
      </p>
    )
  }
  if (canInstall) {
    return (
      <Button className="w-full" onClick={install}>
        <Download className="size-4" /> Instalar Mis Plantas
      </Button>
    )
  }
  return (
    <p className="text-sm text-muted">
      {isIOS() ? (
        <>
          En Safari, pulsa <Share className="inline size-4 align-text-bottom" /> <strong className="text-text">Compartir</strong> y luego{' '}
          <strong className="text-text">Añadir a pantalla de inicio</strong>.
        </>
      ) : (
        <>
          Abre el menú del navegador (⋮) y elige <strong className="text-text">Instalar aplicación</strong> o{' '}
          <strong className="text-text">Añadir a pantalla de inicio</strong>.
        </>
      )}
    </p>
  )
}

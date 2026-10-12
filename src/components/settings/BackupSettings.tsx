import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { backupFilename, BackupError, exportBackup, importBackup, parseBackup, summarize, type BackupFile, type ImportMode } from '../../lib/backup'
import { formatLongDate } from '../../lib/dates'
import { downloadFile } from '../../lib/ics'
import { useToast } from '../ui/Toast'
import { Button, Sheet } from '../ui/ui'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function describe(file: Pick<BackupFile, 'plants' | 'wateringEvents' | 'diagnoses' | 'customSpecies'>) {
  const s = summarize(file)
  return [plural(s.plants, 'planta', 'plantas'), plural(s.wateringEvents, 'riego', 'riegos'), plural(s.diagnoses, 'diagnóstico', 'diagnósticos')].join(', ')
}

/** Exportar e importar todos los datos (copia de seguridad o cambio de móvil). */
export function BackupSettings() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupFile>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const onExport = async () => {
    setBusy(true)
    try {
      const file = await exportBackup()
      downloadFile(JSON.stringify(file), backupFilename(), 'application/json')
      toast.show(`Copia descargada: ${describe(file)}`)
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (f?: File) => {
    if (!f) return
    setError(undefined)
    try {
      setPending(parseBackup(await f.text()))
    } catch (e) {
      setError(e instanceof BackupError ? e.message : 'No se pudo leer el archivo.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onImport = async (mode: ImportMode) => {
    if (!pending) return
    setBusy(true)
    try {
      await importBackup(pending, mode)
      setPending(undefined)
      toast.show(`Importado: ${describe(pending)}`)
    } catch (e) {
      setPending(undefined)
      setError(e instanceof BackupError ? e.message : 'No se pudo importar la copia. Tus datos no se han modificado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" className="w-full" onClick={onExport} disabled={busy}>
        <Download className="size-4" /> Exportar mis datos
      </Button>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="secondary" className="w-full" onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload className="size-4" /> Importar una copia
      </Button>
      {error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      <Sheet open={!!pending} onClose={() => setPending(undefined)} title="Importar copia">
        {pending && (
          <div className="space-y-4">
            <p className="text-sm">
              Copia del <strong>{formatLongDate(pending.exportedAt)}</strong> con {describe(pending)}.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => onImport('combinar')} disabled={busy}>
                Combinar con mis datos
              </Button>
              <p className="px-1 text-xs text-muted">
                Añade lo que falte. Si una planta está en los dos sitios, se queda la versión editada más recientemente.
              </p>
            </div>
            <div className="space-y-2">
              <Button variant="danger" className="w-full" onClick={() => onImport('reemplazar')} disabled={busy}>
                Reemplazar todo
              </Button>
              <p className="px-1 text-xs text-muted">Borra los datos de este dispositivo y deja solo los de la copia. No se puede deshacer.</p>
            </div>
          </div>
        )}
      </Sheet>
      {toast.element}
    </div>
  )
}

import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { resizeImage } from '../../lib/photos'
import { Button } from '../ui/ui'
import { PlantPhoto } from './PlantPhoto'

/** Elegir foto (en el móvil ofrece cámara o galería) y reducirla antes de guardarla. */
export function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (photo: Blob | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await resizeImage(file))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <PlantPhoto photo={value} alt="Foto de la planta" className="size-24 rounded-2xl" />
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Camera className="size-4" /> {busy ? 'Procesando…' : value ? 'Cambiar foto' : 'Añadir foto'}
        </Button>
        {value && (
          <Button variant="ghost" onClick={() => onChange(undefined)} className="text-danger">
            <Trash2 className="size-4" /> Quitar
          </Button>
        )}
      </div>
    </div>
  )
}

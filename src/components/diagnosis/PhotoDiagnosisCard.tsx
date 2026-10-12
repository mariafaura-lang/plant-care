import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { diagnoseFromPhoto, isVisionEnabled } from '../../lib/integrations/vision'
import { resizeImage } from '../../lib/photos'

/**
 * Diagnóstico por foto: solo se muestra si está configurado (ver
 * src/lib/integrations/vision.ts). Por defecto no aparece.
 */
export function PhotoDiagnosisCard({ symptoms }: { symptoms: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string>()
  if (!isVisionEnabled()) return null

  const onFile = async (file?: File) => {
    if (!file) return
    setMessage('Analizando la foto…')
    try {
      const response = await diagnoseFromPhoto({ image: await resizeImage(file), symptoms })
      setMessage(response.explanation ?? 'Listo.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo analizar la foto.')
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-border p-3">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center gap-3 text-left text-sm">
        <Camera className="size-5 text-accent" />
        <span className="flex-1 font-medium">Diagnóstico por foto (beta)</span>
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  )
}

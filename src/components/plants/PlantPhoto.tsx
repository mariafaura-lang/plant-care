import clsx from 'clsx'
import { Sprout } from 'lucide-react'
import { useObjectUrl } from '../../hooks/useObjectUrl'

/** Foto de la planta o, si no tiene, un icono sobre fondo verde suave. */
export function PlantPhoto({ photo, alt, className }: { photo?: Blob; alt: string; className?: string }) {
  const url = useObjectUrl(photo)
  return (
    <div className={clsx('flex shrink-0 items-center justify-center overflow-hidden bg-accent-soft text-accent', className)}>
      {url ? <img src={url} alt={alt} className="size-full object-cover" /> : <Sprout className="size-1/2" aria-hidden />}
    </div>
  )
}

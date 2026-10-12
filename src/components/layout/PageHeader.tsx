import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Muestra un botón para volver atrás (o a esta ruta si se abrió la página directamente). */
  back?: string
}) {
  const navigate = useNavigate()
  const goBack = () => {
    // Si hay historial dentro de la app volvemos atrás; si no (enlace directo), a la ruta indicada.
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(back ?? '/')
  }

  return (
    <header className="safe-top sticky top-0 z-10 bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-1">
          {back !== undefined && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Volver"
              className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-alt"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </header>
  )
}

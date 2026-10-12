import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'water'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'bg-surface-alt text-text border border-border hover:bg-border/60',
  ghost: 'text-text hover:bg-surface-alt',
  danger: 'bg-danger-soft text-danger hover:opacity-90',
  water: 'bg-water text-white dark:text-bg hover:opacity-90',
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-2xl border border-border bg-surface p-4', className)}>{children}</div>
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="max-w-xs text-sm text-muted">{children}</div>}
    </div>
  )
}

/** Selector segmentado (p. ej. tema claro/oscuro/sistema). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface-alt p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'min-h-9 flex-1 rounded-lg px-3 text-sm font-medium transition',
            value === opt.value ? 'bg-surface text-text shadow-sm' : 'text-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const fieldClass =
  'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-text placeholder:text-muted/70 focus:border-accent focus:outline-none'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldClass, props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={clsx(fieldClass, 'resize-y', props.className)} />
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={clsx(fieldClass, 'pl-10')}
      />
    </div>
  )
}

/** Etiqueta pequeña (p. ej. "Tóxica para mascotas"). */
export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'water'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-surface-alt text-muted',
    accent: 'bg-accent-soft text-accent',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    water: 'bg-water-soft text-water',
  }
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}

/** Chip seleccionable para filtros. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-muted',
      )}
    >
      {children}
    </button>
  )
}

/** Panel inferior modal (estilo hoja de móvil). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="safe-bottom relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-bg shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-full hover:bg-surface-alt">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

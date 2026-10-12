import { useCallback, useEffect, useRef, useState } from 'react'

interface ToastState {
  id: number
  message: string
  undo?: () => Promise<void> | void
}

/** Aviso breve encima de la barra inferior, con botón "Deshacer" opcional. */
export function useToast(duration = 5000) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback(
    (message: string, undo?: ToastState['undo']) => {
      clearTimeout(timer.current)
      setToast({ id: Date.now(), message, undo })
      timer.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const element = toast && (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4" role="status" aria-live="polite">
      <div key={toast.id} className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-text px-4 py-3 text-sm text-bg shadow-lg">
        <span className="flex-1">{toast.message}</span>
        {toast.undo && (
          <button
            type="button"
            className="font-semibold text-accent-soft"
            onClick={async () => {
              setToast(null)
              await toast.undo?.()
            }}
          >
            Deshacer
          </button>
        )}
      </div>
    </div>
  )

  return { show, element }
}

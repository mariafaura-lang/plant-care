import { Button, Sheet } from '../ui/ui'

/** "Más tarde": la tierra sigue húmeda → posponer 1, 2 o 3 días. */
export function SnoozeSheet({
  plantName,
  onClose,
  onSnooze,
}: {
  plantName?: string
  onClose: () => void
  onSnooze: (days: number) => void
}) {
  return (
    <Sheet open={!!plantName} onClose={onClose} title="Más tarde">
      <p className="mb-4 text-sm text-muted">
        Si la tierra de <strong className="text-text">{plantName}</strong> sigue húmeda, mejor esperar. ¿Cuándo te lo recuerdo?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((days) => (
          <Button key={days} variant="secondary" onClick={() => onSnooze(days)} className="flex-col py-3">
            <span className="text-lg font-semibold">+{days}</span>
            <span className="text-xs text-muted">{days === 1 ? 'mañana' : `${days} días`}</span>
          </Button>
        ))}
      </div>
    </Sheet>
  )
}

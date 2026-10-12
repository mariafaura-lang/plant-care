import { BellRing, CheckCircle2, Droplets, Leaf, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { useToast } from '../components/ui/Toast'
import { Button, EmptyState } from '../components/ui/ui'
import { SnoozeSheet } from '../components/watering/SnoozeSheet'
import { WateringRow } from '../components/watering/WateringRow'
import { useWateringSchedule } from '../hooks/useWateringSchedule'
import { formatLongDate, formatRelativeDay, formatShortDate } from '../lib/dates'
import { notificationPermission } from '../lib/notifications'
import { groupSchedule, type PlantSchedule } from '../lib/watering'
import { snoozePlant, waterPlants } from '../lib/wateringActions'

function Section({ title, tone, children }: { title: string; tone?: 'danger'; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className={tone === 'danger' ? 'text-sm font-semibold tracking-wide text-danger uppercase' : 'text-sm font-semibold tracking-wide text-muted uppercase'}>
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function TodayPage() {
  const { schedule, settings, today } = useWateringSchedule()
  const [snoozing, setSnoozing] = useState<PlantSchedule>()
  const toast = useToast()

  if (!schedule) return <PageHeader title="Hoy" subtitle={formatLongDate(today)} />

  const groups = groupSchedule(schedule)
  const pending = [...groups.overdue, ...groups.today]
  const next = schedule.find((e) => e.status === 'mas-adelante')

  const water = async (entries: PlantSchedule[]) => {
    const undo = await waterPlants(entries.map((e) => e.plant.id))
    toast.show(entries.length === 1 ? `${entries[0].plant.nickname}: regada 💧` : `${entries.length} plantas regadas 💧`, undo)
  }

  const row = (entry: PlantSchedule, actions = true) => (
    <WateringRow
      key={entry.plant.id}
      entry={entry}
      today={today}
      onWater={() => water([entry])}
      onSnooze={actions ? () => setSnoozing(entry) : undefined}
    />
  )

  const showNotificationHint = settings && !settings.notificationsEnabled && notificationPermission() !== 'no-soportado' && schedule.length > 0

  return (
    <>
      <PageHeader
        title="Hoy"
        subtitle={capitalize(formatLongDate(today))}
        action={
          pending.length > 1 && (
            <Button variant="water" onClick={() => water(pending)}>
              <Droplets className="size-4" /> Regar todas ({pending.length})
            </Button>
          )
        }
      />

      <div className="space-y-5 px-4">
        {schedule.length === 0 && (
          <EmptyState icon={<Leaf className="size-8" />} title="Aún no tienes plantas">
            <p className="mb-4">Añade tus plantas y aquí verás cuáles toca regar cada día.</p>
            <Link to="/plantas/nueva" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-medium text-on-accent">
              <Plus className="size-4" /> Añadir planta
            </Link>
          </EmptyState>
        )}

        {schedule.length > 0 && pending.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4">
            <CheckCircle2 className="size-8 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">Todo al día</p>
              <p className="text-sm text-muted">
                {groups.upcoming.length > 0
                  ? `El próximo riego es ${formatRelativeDay(groups.upcoming[0].day, today)}.`
                  : next
                    ? `El próximo riego es ${formatRelativeDay(next.due, today)}.`
                    : 'Hoy no hay que regar nada.'}
              </p>
            </div>
          </div>
        )}

        {groups.overdue.length > 0 && (
          <Section title={`Atrasadas · ${groups.overdue.length}`} tone="danger">
            {groups.overdue.map((e) => row(e))}
          </Section>
        )}
        {groups.today.length > 0 && <Section title={`Toca hoy · ${groups.today.length}`}>{groups.today.map((e) => row(e))}</Section>}

        {groups.upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Próximos 7 días</h2>
            {groups.upcoming.map(({ day, entries }) => (
              <div key={day} className="space-y-2">
                <p className="text-sm font-medium">
                  {capitalize(formatRelativeDay(day, today))} <span className="font-normal text-muted">· {formatShortDate(day)}</span>
                </p>
                {entries.map((e) => row(e, false))}
              </div>
            ))}
          </section>
        )}

        {showNotificationHint && (
          <Link to="/ajustes" className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3 text-sm text-muted">
            <BellRing className="size-5 shrink-0 text-accent" />
            Activa los avisos para que la app te recuerde cuándo regar.
          </Link>
        )}
      </div>

      <SnoozeSheet
        plantName={snoozing?.plant.nickname}
        onClose={() => setSnoozing(undefined)}
        onSnooze={async (days) => {
          if (!snoozing) return
          await snoozePlant(snoozing.plant.id, days)
          toast.show(`${snoozing.plant.nickname}: te lo recuerdo ${days === 1 ? 'mañana' : `en ${days} días`}`)
          setSnoozing(undefined)
        }}
      />
      {toast.element}
    </>
  )
}

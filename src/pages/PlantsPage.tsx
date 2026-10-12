import { BookOpen, Droplets, Leaf, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PlantCard } from '../components/plants/PlantCard'
import { Badge, EmptyState, SearchInput } from '../components/ui/ui'
import { usePlants } from '../hooks/usePlants'
import { useSpeciesList } from '../hooks/useSpecies'
import { useWateringSchedule } from '../hooks/useWateringSchedule'
import { wateringStatusText } from '../lib/wateringText'
import { filterPlants, groupByRoom } from '../lib/plants'
import { findSpecies } from '../lib/species'
import type { PlantSchedule } from '../lib/watering'

function WateringBadge({ entry, today }: { entry?: PlantSchedule; today: string }) {
  if (!entry) return null
  const tone = entry.status === 'atrasada' ? 'danger' : entry.status === 'hoy' ? 'water' : 'neutral'
  return (
    <div className="mt-1">
      <Badge tone={tone}>
        <Droplets className="size-3" /> {wateringStatusText(entry, today)}
      </Badge>
    </div>
  )
}

export function PlantsPage() {
  const plants = usePlants()
  const species = useSpeciesList()
  const [query, setQuery] = useState('')
  const { schedule, today } = useWateringSchedule()
  const scheduleById = new Map(schedule?.map((e) => [e.plant.id, e]))

  const groups = plants ? groupByRoom(filterPlants(plants, query, species)) : []
  const count = plants?.length ?? 0

  return (
    <>
      <PageHeader
        title="Mis plantas"
        subtitle={plants ? `${count} ${count === 1 ? 'planta' : 'plantas'}` : undefined}
        action={
          <Link
            to="/plantas/nueva"
            aria-label="Añadir planta"
            className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm"
          >
            <Plus className="size-6" />
          </Link>
        }
      />

      <div className="space-y-4 px-4">
        {count > 0 && <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, especie o habitación" />}

        <Link to="/catalogo" className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3 text-sm font-medium text-accent">
          <BookOpen className="size-5" />
          Catálogo de especies: luz, riego, toxicidad y consejos
        </Link>

        {plants && count === 0 && (
          <EmptyState icon={<Leaf className="size-8" />} title="Aún no tienes plantas">
            <p className="mb-4">Añade tu primera planta para empezar a recibir recordatorios de riego.</p>
            <Link to="/plantas/nueva" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-medium text-on-accent">
              <Plus className="size-4" /> Añadir planta
            </Link>
          </EmptyState>
        )}

        {count > 0 && groups.length === 0 && <p className="py-8 text-center text-sm text-muted">Ninguna planta coincide con «{query}».</p>}

        {groups.map((group) => (
          <section key={group.room} className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
              {group.room} <span className="font-normal">· {group.plants.length}</span>
            </h2>
            <div className="space-y-2">
              {group.plants.map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  species={findSpecies(plant.speciesId, species)}
                  extra={<WateringBadge entry={scheduleById.get(plant.id)} today={today} />}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

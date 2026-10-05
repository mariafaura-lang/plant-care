import { CalendarDays, Camera, DoorOpen, Flower, Pencil, StickyNote, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PlantPhoto } from '../components/plants/PlantPhoto'
import { SpeciesCareInfo } from '../components/species/SpeciesCareInfo'
import { WateringSection } from '../components/watering/WateringSection'
import { Button, Card, Sheet } from '../components/ui/ui'
import { usePlant } from '../hooks/usePlants'
import { useSpeciesList } from '../hooks/useSpecies'
import { formatLongDate } from '../lib/dates'
import { deletePlant } from '../lib/plants'
import { findSpecies } from '../lib/species'
import { POT_SIZE_LABELS, POT_TYPE_LABELS } from '../types'

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm whitespace-pre-line">{children}</p>
      </div>
    </div>
  )
}

export function PlantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const plant = usePlant(id)
  const species = findSpecies(plant?.speciesId, useSpeciesList())
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (plant === undefined) return null
  if (plant === null) {
    return (
      <>
        <PageHeader title="Planta no encontrada" back="/plantas" />
        <p className="px-4 text-muted">Puede que se haya borrado.</p>
      </>
    )
  }

  const onDelete = async () => {
    await deletePlant(plant.id)
    navigate('/plantas', { replace: true })
  }

  return (
    <>
      <PageHeader
        title={plant.nickname}
        subtitle={species?.commonName}
        back="/plantas"
        action={
          <Link
            to={`/plantas/${plant.id}/editar`}
            aria-label="Editar"
            className="flex size-10 items-center justify-center rounded-full bg-surface-alt"
          >
            <Pencil className="size-5" />
          </Link>
        }
      />

      <div className="space-y-4 px-4 pb-6">
        {plant.photo ? (
          <PlantPhoto photo={plant.photo} alt={plant.nickname} className="aspect-square w-full rounded-3xl" />
        ) : (
          <Link
            to={`/plantas/${plant.id}/editar`}
            className="flex h-28 items-center justify-center gap-3 rounded-3xl bg-accent-soft text-sm font-medium text-accent"
          >
            <Camera className="size-5" /> Añadir una foto
          </Link>
        )}

        <Card className="divide-y divide-border py-1">
          <InfoRow icon={<DoorOpen className="size-5" />} label="Habitación">
            {plant.room}
          </InfoRow>
          <InfoRow icon={<Flower className="size-5" />} label="Maceta">
            {POT_TYPE_LABELS[plant.potType]} · {POT_SIZE_LABELS[plant.potSize]}
          </InfoRow>
          {plant.purchaseDate && (
            <InfoRow icon={<CalendarDays className="size-5" />} label="Fecha de compra">
              {formatLongDate(plant.purchaseDate)}
            </InfoRow>
          )}
          {plant.notes && (
            <InfoRow icon={<StickyNote className="size-5" />} label="Notas">
              {plant.notes}
            </InfoRow>
          )}
        </Card>

        <WateringSection plant={plant} species={species} />

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Cuidados</h2>
          {species ? (
            <>
              <p className="text-sm text-muted italic">{species.scientificName}</p>
              <SpeciesCareInfo species={species} />
            </>
          ) : (
            <Card>
              <p className="text-sm text-muted">
                No has indicado la especie. <Link to={`/plantas/${plant.id}/editar`} className="font-medium text-accent">Elígela</Link> para
                ver sus cuidados y calcular mejor el riego.
              </p>
            </Card>
          )}
        </section>

        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" /> Borrar planta
        </Button>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Borrar planta?">
        <p className="mb-4 text-sm text-muted">
          Se borrará «{plant.nickname}» junto con su historial de riegos y diagnósticos. No se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={onDelete}>
            Borrar
          </Button>
        </div>
      </Sheet>
    </>
  )
}

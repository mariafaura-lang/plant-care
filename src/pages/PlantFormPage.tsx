import { ChevronRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PhotoPicker } from '../components/plants/PhotoPicker'
import { SpeciesPicker } from '../components/species/SpeciesPicker'
import { SpeciesListItem } from '../components/species/SpeciesListItem'
import { Button, Field, Segmented, TextArea, TextInput } from '../components/ui/ui'
import { usePlant, usePlants } from '../hooks/usePlants'
import { useSpeciesList } from '../hooks/useSpecies'
import { today } from '../lib/dates'
import { createPlant, roomSuggestions, updatePlant, type PlantInput } from '../lib/plants'
import { findSpecies } from '../lib/species'
import { POT_SIZE_LABELS, POT_TYPE_LABELS, type PotSize, type PotType } from '../types'

const EMPTY: PlantInput = { nickname: '', room: '', potType: 'plastico', potSize: 'mediana' }

export function PlantFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const existing = usePlant(id)

  // `key` fuerza un formulario limpio al volver a abrir "Nueva planta" desde el propio formulario.
  if (!id) return <PlantForm key={searchParams.toString()} initial={{ ...EMPTY, speciesId: searchParams.get('especie') ?? undefined }} />
  if (existing === undefined) return null // cargando
  if (existing === null) return <PageHeader title="Planta no encontrada" back="/plantas" />

  const { id: _id, createdAt: _c, updatedAt: _u, ...initial } = existing
  return <PlantForm key={id} id={id} initial={initial} />
}

function PlantForm({ id, initial }: { id?: string; initial: PlantInput }) {
  const navigate = useNavigate()
  const allPlants = usePlants()
  const species = useSpeciesList()

  const [form, setForm] = useState<PlantInput>(initial)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof PlantInput>(key: K, value: PlantInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const selectedSpecies = findSpecies(form.speciesId, species)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nickname.trim()) return
    setSaving(true)
    try {
      if (id) {
        await updatePlant(id, form)
        navigate(`/plantas/${id}`, { replace: true })
      } else {
        const newId = await createPlant(form)
        navigate(`/plantas/${newId}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title={id ? 'Editar planta' : 'Nueva planta'} back={id ? `/plantas/${id}` : '/plantas'} />
      <form onSubmit={onSubmit} className="space-y-5 px-4 pb-6">
        <PhotoPicker value={form.photo} onChange={(photo) => set('photo', photo)} />

        <Field label="Apodo">
          <TextInput
            value={form.nickname}
            onChange={(e) => set('nickname', e.target.value)}
            placeholder="Ej.: Monsti"
            required
            maxLength={60}
            autoFocus={!id}
          />
        </Field>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Especie</span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left"
          >
            {selectedSpecies ? <SpeciesListItem species={selectedSpecies} /> : <span className="flex-1 text-muted">Elegir especie…</span>}
            <ChevronRight className="size-5 shrink-0 text-muted" />
          </button>
        </div>

        <Field label="Habitación">
          <TextInput
            value={form.room}
            onChange={(e) => set('room', e.target.value)}
            placeholder="Ej.: Salón"
            list="room-suggestions"
            maxLength={40}
          />
          <datalist id="room-suggestions">
            {roomSuggestions(allPlants ?? []).map((room) => (
              <option key={room} value={room} />
            ))}
          </datalist>
        </Field>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Tipo de maceta</span>
          <Segmented<PotType>
            label="Tipo de maceta"
            value={form.potType}
            onChange={(v) => set('potType', v)}
            options={(Object.keys(POT_TYPE_LABELS) as PotType[]).map((v) => ({
              value: v,
              label: v === 'ceramica' ? 'Cerámica' : POT_TYPE_LABELS[v],
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Tamaño de maceta</span>
          <Segmented<PotSize>
            label="Tamaño de maceta"
            value={form.potSize}
            onChange={(v) => set('potSize', v)}
            options={(Object.keys(POT_SIZE_LABELS) as PotSize[]).map((v) => ({ value: v, label: POT_SIZE_LABELS[v].split(' ')[0] }))}
          />
          <p className="text-xs text-muted">{POT_SIZE_LABELS[form.potSize]} de diámetro</p>
        </div>

        <Field label="Fecha de compra (opcional)">
          <TextInput type="date" value={form.purchaseDate ?? ''} max={today()} onChange={(e) => set('purchaseDate', e.target.value || undefined)} />
        </Field>

        <Field label="Notas (opcional)">
          <TextArea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Ej.: regalo de mi madre, la trasplanté en marzo…" />
        </Field>

        <Button type="submit" className="w-full" disabled={saving || !form.nickname.trim()}>
          {id ? 'Guardar cambios' : 'Añadir planta'}
        </Button>
      </form>

      <SpeciesPicker open={pickerOpen} onClose={() => setPickerOpen(false)} selectedId={form.speciesId} onSelect={(sid) => set('speciesId', sid)} />
    </>
  )
}

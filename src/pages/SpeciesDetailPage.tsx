import { Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { SpeciesCareInfo } from '../components/species/SpeciesCareInfo'
import { useSpeciesList } from '../hooks/useSpecies'
import { findSpecies } from '../lib/species'

export function SpeciesDetailPage() {
  const { speciesId } = useParams()
  const species = findSpecies(speciesId, useSpeciesList())

  if (!species) {
    return <PageHeader title="Especie no encontrada" back="/catalogo" />
  }

  return (
    <>
      <PageHeader title={species.commonName} subtitle={species.scientificName} back="/catalogo" />
      <div className="space-y-4 px-4 pb-6">
        {species.otherNames && species.otherNames.length > 0 && (
          <p className="text-sm text-muted">También llamada: {species.otherNames.join(', ')}</p>
        )}
        <SpeciesCareInfo species={species} />
        <Link
          to={`/plantas/nueva?especie=${encodeURIComponent(species.id)}`}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-on-accent"
        >
          <Plus className="size-4" /> Añadir a mis plantas
        </Link>
      </div>
    </>
  )
}

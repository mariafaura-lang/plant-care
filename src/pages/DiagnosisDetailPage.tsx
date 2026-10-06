import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiagnosisResults } from '../components/diagnosis/DiagnosisResults'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Sheet } from '../components/ui/ui'
import { useDiagnosis } from '../hooks/useDiagnoses'
import { usePlant } from '../hooks/usePlants'
import { formatLongDate } from '../lib/dates'
import { RULES, symptomLabel } from '../lib/diagnosis'
import { deleteDiagnosis } from '../lib/diagnosisActions'

/** Un diagnóstico guardado en el historial de una planta. */
export function DiagnosisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const diagnosis = useDiagnosis(id)
  const plant = usePlant(diagnosis?.plantId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (diagnosis === undefined) return null
  if (diagnosis === null) return <PageHeader title="Diagnóstico no encontrado" back="/diagnostico" />

  const answered = RULES.questions
    .filter((q) => !q.derived && diagnosis.answers[q.id])
    .map((q) => ({ q: q.text, a: q.options.find((o) => o.id === diagnosis.answers[q.id])?.label }))

  return (
    <>
      <PageHeader title="Diagnóstico" subtitle={formatLongDate(diagnosis.date)} back={`/plantas/${diagnosis.plantId}`} />
      <div className="space-y-4 px-4 pb-6">
        <Card className="space-y-2 text-sm">
          {plant && (
            <p>
              <span className="text-muted">Planta: </span>
              <Link to={`/plantas/${plant.id}`} className="font-medium text-accent">
                {plant.nickname}
              </Link>
            </p>
          )}
          <p>
            <span className="text-muted">Síntomas: </span>
            {diagnosis.symptoms.map((s) => symptomLabel(s)).join(', ')}
          </p>
          {answered.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-2 text-muted">
              {answered.map(({ q, a }) => (
                <li key={q}>
                  {q} <span className="text-text">{a}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <DiagnosisResults results={diagnosis.results} />

        <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" /> Borrar del historial
        </Button>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Borrar diagnóstico?">
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              await deleteDiagnosis(diagnosis.id)
              navigate(`/plantas/${diagnosis.plantId}`, { replace: true })
            }}
          >
            Borrar
          </Button>
        </div>
      </Sheet>
    </>
  )
}

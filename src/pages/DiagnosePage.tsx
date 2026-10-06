import clsx from 'clsx'
import { Check, ChevronLeft, HelpCircle, RotateCcw, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DiagnosisResults } from '../components/diagnosis/DiagnosisResults'
import { PhotoDiagnosisCard } from '../components/diagnosis/PhotoDiagnosisCard'
import { PageHeader } from '../components/layout/PageHeader'
import { PlantPhoto } from '../components/plants/PlantPhoto'
import { Button } from '../components/ui/ui'
import { useWateringSchedule } from '../hooks/useWateringSchedule'
import { contextAnswers, diagnose, RULES, symptomLabel, visibleQuestions } from '../lib/diagnosis'
import { saveDiagnosis } from '../lib/diagnosisActions'
import { newId } from '../lib/ids'

type Step = 'planta' | 'sintomas' | 'preguntas' | 'resultado'

const optionClass = (selected: boolean) =>
  clsx(
    'flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition',
    selected ? 'border-accent bg-accent-soft font-medium' : 'border-border bg-surface',
  )

export function DiagnosePage() {
  const [searchParams] = useSearchParams()
  const plant = searchParams.get('planta') ?? undefined
  // `key`: al abrir el asistente desde otra planta (?planta=…), empieza de cero.
  return <DiagnoseWizard key={plant ?? ''} initialPlant={plant} />
}

function DiagnoseWizard({ initialPlant }: { initialPlant?: string }) {
  const { schedule } = useWateringSchedule()
  const [step, setStep] = useState<Step>(initialPlant ? 'sintomas' : 'planta')
  const [plantId, setPlantId] = useState<string | undefined>(initialPlant)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [savedId, setSavedId] = useState<string>()
  const recordId = useRef(newId())

  useEffect(() => window.scrollTo(0, 0), [step])

  const entry = schedule?.find((e) => e.plant.id === plantId)
  const questions = useMemo(() => visibleQuestions(symptoms), [symptoms])
  const fullAnswers = useMemo(
    () => ({
      ...contextAnswers(entry?.species, entry),
      // Solo cuentan las respuestas a preguntas que siguen visibles (si se desmarca un síntoma, su pregunta deja de contar).
      ...Object.fromEntries(Object.entries(answers).filter(([q]) => questions.some((vq) => vq.id === q))),
    }),
    [entry, answers, questions],
  )
  const results = useMemo(() => diagnose({ symptoms, answers: fullAnswers }), [symptoms, fullAnswers])

  // Al llegar al resultado se guarda en el historial de la planta (y se actualiza si se vuelve atrás y se cambia algo).
  useEffect(() => {
    if (step !== 'resultado' || !plantId) return
    const id = recordId.current
    saveDiagnosis({ id, plantId, date: new Date().toISOString(), symptoms, answers: fullAnswers, results }).then(() => setSavedId(id))
  }, [step, plantId, symptoms, fullAnswers, results])

  const restart = () => {
    recordId.current = newId()
    setSavedId(undefined)
    setSymptoms([])
    setAnswers({})
    setStep(plantId ? 'sintomas' : 'planta')
  }

  const toggleSymptom = (id: string) => setSymptoms((list) => (list.includes(id) ? list.filter((s) => s !== id) : [...list, id]))

  const stepNumber = { planta: 1, sintomas: 2, preguntas: 3, resultado: 4 }[step]

  const backButton = (to: Step) => (
    <Button variant="ghost" onClick={() => setStep(to)}>
      <ChevronLeft className="size-4" /> Atrás
    </Button>
  )

  return (
    <>
      <PageHeader title="¿Qué le pasa?" subtitle={entry ? `${entry.plant.nickname} · paso ${stepNumber} de 4` : `Paso ${stepNumber} de 4`} />

      <div className="space-y-4 px-4 pb-6">
        {step === 'planta' && (
          <>
            <p className="text-sm text-muted">
              ¿Qué planta tiene el problema? Así guardo el diagnóstico en su historial y tengo en cuenta su especie y su riego.
            </p>
            <div className="space-y-2">
              {schedule?.map((e) => (
                <button key={e.plant.id} type="button" className={optionClass(plantId === e.plant.id)} onClick={() => setPlantId(e.plant.id)}>
                  <PlantPhoto photo={e.plant.photo} alt="" className="size-10 rounded-lg" />
                  <span className="flex-1">
                    {e.plant.nickname}
                    <span className="block text-xs font-normal text-muted">{e.species?.commonName ?? 'Especie sin indicar'}</span>
                  </span>
                  {plantId === e.plant.id && <Check className="size-5 text-accent" />}
                </button>
              ))}
              <button type="button" className={optionClass(plantId === undefined)} onClick={() => setPlantId(undefined)}>
                <HelpCircle className="size-5 text-muted" />
                <span className="flex-1">Otra planta (sin guardar)</span>
                {plantId === undefined && <Check className="size-5 text-accent" />}
              </button>
            </div>
            <Button className="w-full" onClick={() => setStep('sintomas')}>
              Continuar
            </Button>
          </>
        )}

        {step === 'sintomas' && (
          <>
            <p className="text-sm text-muted">Marca todo lo que veas (puedes elegir varios).</p>
            <PhotoDiagnosisCard symptoms={symptoms.map((s) => symptomLabel(s))} />
            <div className="grid grid-cols-2 gap-2">
              {RULES.symptoms.map((s) => {
                const selected = symptoms.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSymptom(s.id)}
                    className={clsx(
                      'relative rounded-xl border p-3 text-left transition',
                      selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
                    )}
                  >
                    {selected && <Check className="absolute top-2 right-2 size-4 text-accent" />}
                    <span className="block pr-4 text-sm font-medium">{s.label}</span>
                    {s.description && <span className="mt-0.5 block text-xs text-muted">{s.description}</span>}
                  </button>
                )
              })}
            </div>
            <div className="sticky bottom-20 flex gap-2 bg-bg/95 py-2 backdrop-blur">
              {backButton('planta')}
              <Button className="flex-1" disabled={symptoms.length === 0} onClick={() => setStep('preguntas')}>
                Continuar{symptoms.length > 0 && ` (${symptoms.length})`}
              </Button>
            </div>
          </>
        )}

        {step === 'preguntas' && (
          <>
            <p className="text-sm text-muted">Unas preguntas para afinar. Si no lo sabes, déjalo en «No lo sé».</p>
            {questions.map((q) => (
              <div key={q.id} role="radiogroup" aria-label={q.text} className="space-y-2 rounded-2xl border border-border bg-surface p-3">
                <p className="font-medium">{q.text}</p>
                {q.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={answers[q.id] === o.id}
                    className={optionClass(answers[q.id] === o.id)}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={!answers[q.id]}
                  className={clsx(optionClass(!answers[q.id]), 'text-muted')}
                  onClick={() => setAnswers(({ [q.id]: _removed, ...rest }) => rest)}
                >
                  No lo sé
                </button>
              </div>
            ))}
            <div className="sticky bottom-20 flex gap-2 bg-bg/95 py-2 backdrop-blur">
              {backButton('sintomas')}
              <Button className="flex-1" onClick={() => setStep('resultado')}>
                <Stethoscope className="size-4" /> Ver diagnóstico
              </Button>
            </div>
          </>
        )}

        {step === 'resultado' && (
          <>
            <p className="text-sm text-muted">
              <span className="font-medium text-text">Síntomas: </span>
              {symptoms.map((s) => symptomLabel(s)).join(', ')}
            </p>
            <DiagnosisResults results={results} />
            {entry && savedId && (
              <p className="rounded-xl bg-surface-alt p-3 text-sm">
                Guardado en el historial de{' '}
                <Link to={`/plantas/${entry.plant.id}`} className="font-medium text-accent">
                  {entry.plant.nickname}
                </Link>
                .
              </p>
            )}
            <div className="flex gap-2">
              {backButton('preguntas')}
              <Button variant="secondary" className="flex-1" onClick={restart}>
                <RotateCcw className="size-4" /> Nuevo diagnóstico
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

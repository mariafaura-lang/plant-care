import rulesData from '../data/diagnosis-rules.json'
import type { DiagnosisResult, Species } from '../types'
import type { PlantSchedule } from './watering'

// Motor de diagnóstico por reglas. Los datos (síntomas, preguntas, causas,
// tratamientos y reglas) están en src/data/diagnosis-rules.json; aquí solo
// está la lógica, pura y con tests.
//
// Cada regla suma (o resta) su peso a una causa si se cumplen sus condiciones:
//   · symptoms: el usuario marcó AL MENOS UNO de esos síntomas
//   · answers:  para CADA pregunta indicada, la respuesta es una de las opciones
// Una causa solo aparece si alguna regla con síntomas la apoya y su total es
// positivo. La probabilidad es su parte del total entre las causas devueltas.

export interface Symptom {
  id: string
  label: string
  description?: string
}

export interface QuestionOption {
  id: string
  label: string
}

export interface Question {
  id: string
  text: string
  options: QuestionOption[]
  /** Solo se pregunta si se marcó alguno de estos síntomas. */
  showIfSymptoms?: string[]
  /** No se pregunta si se marcó alguno de estos síntomas. */
  hideIfSymptoms?: string[]
  /** No se pregunta: se rellena con datos de la planta (especie, riego). */
  derived?: boolean
}

export type CauseCategory = 'riego' | 'luz' | 'ambiente' | 'plaga' | 'enfermedad' | 'nutricion' | 'maceta'

export interface Cause {
  id: string
  name: string
  category: CauseCategory
  summary: string
  urgency: 'alta' | 'media' | 'baja'
  treatment: string[]
  prevention?: string
}

export interface Rule {
  cause: string
  weight: number
  symptoms?: string[]
  answers?: Record<string, string[]>
}

export interface DiagnosisRules {
  version: number
  symptoms: Symptom[]
  questions: Question[]
  causes: Cause[]
  rules: Rule[]
}

export interface DiagnosisInput {
  symptoms: string[]
  /** Pregunta → opción elegida. Las no respondidas ("No lo sé") simplemente no están. */
  answers: Record<string, string>
}

export const RULES = rulesData as DiagnosisRules
export const MAX_RESULTS = 5

/** Preguntas que hay que hacer según los síntomas marcados (las condicionales primero). */
export function visibleQuestions(symptoms: string[], rules: DiagnosisRules = RULES): Question[] {
  const has = (list?: string[]) => !!list?.some((s) => symptoms.includes(s))
  const visible = rules.questions.filter((q) => !q.derived && (!q.showIfSymptoms || has(q.showIfSymptoms)) && !has(q.hideIfSymptoms))
  return [...visible.filter((q) => q.showIfSymptoms), ...visible.filter((q) => !q.showIfSymptoms)]
}

/** Respuestas que se deducen de la planta elegida, sin preguntar. */
export function contextAnswers(species?: Pick<Species, 'humidity' | 'light'>, schedule?: Pick<PlantSchedule, 'status'>): Record<string, string> {
  const answers: Record<string, string> = {}
  if (species) {
    answers['especie-humedad'] = species.humidity
    answers['especie-luz'] = species.light
  }
  if (schedule) answers['estado-riego'] = schedule.status === 'atrasada' ? 'atrasada' : 'al-dia'
  return answers
}

function ruleMatches(rule: Rule, input: DiagnosisInput): boolean {
  if (rule.symptoms && !rule.symptoms.some((s) => input.symptoms.includes(s))) return false
  for (const [question, options] of Object.entries(rule.answers ?? {})) {
    const answer = input.answers[question]
    if (answer === undefined || !options.includes(answer)) return false
  }
  return true
}

/** Causas probables ordenadas de más a menos probable. */
export function diagnose(input: DiagnosisInput, rules: DiagnosisRules = RULES, limit = MAX_RESULTS): DiagnosisResult[] {
  if (input.symptoms.length === 0) return []
  const scores = new Map<string, number>()
  const supported = new Set<string>()

  for (const rule of rules.rules) {
    if (!ruleMatches(rule, input)) continue
    scores.set(rule.cause, (scores.get(rule.cause) ?? 0) + rule.weight)
    if (rule.symptoms && rule.weight > 0) supported.add(rule.cause)
  }

  const ranked = [...scores.entries()]
    .filter(([cause, score]) => score > 0 && supported.has(cause))
    .sort(([a, sa], [b, sb]) => sb - sa || a.localeCompare(b))
    .slice(0, limit)
  const total = ranked.reduce((sum, [, score]) => sum + score, 0)
  return ranked.map(([causeId, score]) => ({ causeId, score, probability: score / total }))
}

export type Likelihood = 'muy-probable' | 'probable' | 'posible'

export function likelihood(probability: number): Likelihood {
  if (probability >= 0.45) return 'muy-probable'
  if (probability >= 0.2) return 'probable'
  return 'posible'
}

export const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
  'muy-probable': 'Muy probable',
  probable: 'Probable',
  posible: 'Posible',
}

export function findCause(id: string, rules: DiagnosisRules = RULES): Cause | undefined {
  return rules.causes.find((c) => c.id === id)
}

export function symptomLabel(id: string, rules: DiagnosisRules = RULES): string {
  return rules.symptoms.find((s) => s.id === id)?.label ?? id
}

/** Comprueba que el JSON de reglas es coherente. Devuelve la lista de errores (vacía si todo bien). */
export function validateRules(rules: DiagnosisRules): string[] {
  const errors: string[] = []
  const symptomIds = new Set(rules.symptoms.map((s) => s.id))
  const causeIds = new Set(rules.causes.map((c) => c.id))
  const questions = new Map(rules.questions.map((q) => [q.id, q]))

  const unique = (ids: string[], kind: string) => {
    if (new Set(ids).size !== ids.length) errors.push(`Hay ${kind} con id repetido`)
  }
  unique(rules.symptoms.map((s) => s.id), 'síntomas')
  unique(rules.causes.map((c) => c.id), 'causas')
  unique(rules.questions.map((q) => q.id), 'preguntas')

  for (const q of rules.questions) {
    for (const s of [...(q.showIfSymptoms ?? []), ...(q.hideIfSymptoms ?? [])]) {
      if (!symptomIds.has(s)) errors.push(`Pregunta ${q.id}: síntoma desconocido ${s}`)
    }
  }
  for (const c of rules.causes) {
    if (c.treatment.length < 3) errors.push(`Causa ${c.id}: el tratamiento necesita al menos 3 pasos`)
  }
  rules.rules.forEach((r, i) => {
    const where = `Regla ${i} (${r.cause})`
    if (!causeIds.has(r.cause)) errors.push(`${where}: causa desconocida`)
    if (!r.symptoms && !r.answers) errors.push(`${where}: no tiene condiciones`)
    for (const s of r.symptoms ?? []) if (!symptomIds.has(s)) errors.push(`${where}: síntoma desconocido ${s}`)
    for (const [qid, options] of Object.entries(r.answers ?? {})) {
      const q = questions.get(qid)
      if (!q) errors.push(`${where}: pregunta desconocida ${qid}`)
      else for (const o of options) if (!q.options.some((opt) => opt.id === o)) errors.push(`${where}: opción desconocida ${qid}=${o}`)
    }
  })
  for (const c of causeIds) {
    if (!rules.rules.some((r) => r.cause === c && r.weight > 0 && r.symptoms)) errors.push(`Causa ${c}: ninguna regla puede llegar a ella`)
  }
  for (const s of symptomIds) {
    if (!rules.rules.some((r) => r.symptoms?.includes(s))) errors.push(`Síntoma ${s}: no lo usa ninguna regla`)
  }
  return errors
}

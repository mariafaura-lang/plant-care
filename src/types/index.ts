// Modelo de datos de la app. Todas las fechas "de día" se guardan como
// 'YYYY-MM-DD' en hora local (ver src/lib/dates.ts) y los instantes como ISO 8601.

/** Fecha local sin hora, formato 'YYYY-MM-DD'. */
export type ISODate = string
/** Instante completo, formato ISO 8601 (`new Date().toISOString()`). */
export type ISODateTime = string

// ─── Catálogo de especies ────────────────────────────────────────────────────

export type LightLevel = 'baja' | 'media' | 'indirecta-brillante' | 'sol-directo'
export type HumidityLevel = 'baja' | 'media' | 'alta'
export type Difficulty = 'facil' | 'media' | 'dificil'
export type SpeciesSource = 'catalogo' | 'plantbook' | 'propia'

export interface Species {
  id: string
  /** Nombre común en español (el principal). */
  commonName: string
  /** Otros nombres comunes, para el buscador (p. ej. "potus", "poto"). */
  otherNames?: string[]
  scientificName: string
  light: LightLevel
  humidity: HumidityLevel
  /** Temperaturas en ºC. */
  tempMin: number
  tempMax: number
  /** Intervalo de riego base en días. */
  waterDaysSummer: number
  waterDaysWinter: number
  difficulty: Difficulty
  /** Tóxica para perros y/o gatos. `null` = no se sabe (p. ej. especies de Open Plantbook). */
  petToxic: boolean | null
  toxicityNote?: string
  tip: string
  source?: SpeciesSource
}

// ─── Plantas del usuario ─────────────────────────────────────────────────────

export type PotType = 'barro' | 'plastico' | 'ceramica'
export type PotSize = 'pequena' | 'mediana' | 'grande'

export interface Plant {
  id: string
  nickname: string
  /** Id de una especie del catálogo o de `customSpecies`. Opcional: se puede añadir sin saber la especie. */
  speciesId?: string
  room: string
  /** Foto ya reducida en el navegador (JPEG). */
  photo?: Blob
  purchaseDate?: ISODate
  potType: PotType
  potSize: PotSize
  notes?: string
  /**
   * Ajuste personal del riego, aceptado desde la sugerencia adaptativa:
   * multiplica el intervalo calculado (0,8 = regar un 20 % más a menudo).
   * Se guarda como factor y no como días para que siga ajustándose por estación.
   */
  wateringFactor?: number
  /** Si se pulsó "Más tarde", no se vuelve a pedir riego antes de esta fecha. */
  snoozedUntil?: ISODate
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

// ─── Riego ───────────────────────────────────────────────────────────────────

export type WateringKind = 'regada' | 'pospuesta'

export interface WateringEvent {
  id: string
  plantId: string
  date: ISODateTime
  kind: WateringKind
  /** Solo para `pospuesta`: cuántos días se pospuso. */
  snoozeDays?: number
}

// ─── Diagnóstico ─────────────────────────────────────────────────────────────

export interface DiagnosisResult {
  causeId: string
  /** Puntuación bruta del motor de reglas. */
  score: number
  /** Probabilidad relativa normalizada (0-1) entre las causas devueltas. */
  probability: number
}

export interface DiagnosisRecord {
  id: string
  plantId: string
  date: ISODateTime
  symptoms: string[]
  /** Respuestas a las preguntas de contexto: id de pregunta → id de opción. */
  answers: Record<string, string>
  results: DiagnosisResult[]
  /** Foto opcional (para el futuro diagnóstico por foto). */
  photo?: Blob
  notes?: string
}

// ─── Ajustes ─────────────────────────────────────────────────────────────────

export type ThemePreference = 'sistema' | 'claro' | 'oscuro'
export type Hemisphere = 'norte' | 'sur'

// El tema NO va aquí: se guarda en localStorage para aplicarlo antes de pintar
// la página (ver index.html y src/hooks/useTheme.ts) y evitar un parpadeo.
export interface Settings {
  /** Para saber si es verano o invierno. */
  hemisphere: Hemisphere
  notificationsEnabled: boolean
  /** Hora del aviso diario de riego (0-23). */
  notificationHour: number
  /** Último día en que se mostró el aviso de riego (para no repetirlo). */
  lastNotifiedDay?: ISODate
  /** API key de Open Plantbook introducida por el usuario (se guarda solo en este dispositivo). */
  plantbookApiKey?: string
}

export const DEFAULT_SETTINGS: Settings = {
  hemisphere: 'norte',
  notificationsEnabled: false,
  notificationHour: 9,
}

// ─── Etiquetas para la interfaz ──────────────────────────────────────────────

export const POT_TYPE_LABELS: Record<PotType, string> = {
  barro: 'Barro',
  plastico: 'Plástico',
  ceramica: 'Cerámica esmaltada',
}

export const POT_SIZE_LABELS: Record<PotSize, string> = {
  pequena: 'Pequeña (< 14 cm)',
  mediana: 'Mediana (14-24 cm)',
  grande: 'Grande (> 24 cm)',
}

export const LIGHT_LABELS: Record<LightLevel, string> = {
  baja: 'Poca luz',
  media: 'Luz media',
  'indirecta-brillante': 'Mucha luz indirecta',
  'sol-directo': 'Sol directo',
}

export const HUMIDITY_LABELS: Record<HumidityLevel, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil',
}

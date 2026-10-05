import type { HumidityLevel, LightLevel, Settings, Species } from '../../types'

/**
 * Integración OPCIONAL con Open Plantbook (https://open.plantbook.io), para
 * buscar especies que no están en el catálogo. Solo se activa si hay una API
 * key (en Ajustes o en VITE_PLANTBOOK_API_KEY). Es gratuita: basta con
 * registrarse en open.plantbook.io y generar una key.
 *
 * Plantbook da rangos de luz (lux), temperatura y humedad, pero NO intervalos
 * de riego ni toxicidad: el riego se estima a partir de la humedad de suelo
 * recomendada y la toxicidad queda como desconocida.
 */

const API_BASE = 'https://open.plantbook.io/api/v1'

export interface PlantbookSearchResult {
  pid: string
  display_pid: string
  alias: string
  category?: string
}

export interface PlantbookDetail {
  pid: string
  display_pid: string
  alias: string
  category?: string
  max_light_lux: number
  min_light_lux: number
  max_temp: number
  min_temp: number
  max_env_humid: number
  min_env_humid: number
  max_soil_moist: number
  min_soil_moist: number
  image_url?: string
}

export class PlantbookError extends Error {}

export function getPlantbookKey(settings?: Pick<Settings, 'plantbookApiKey'>): string | undefined {
  return settings?.plantbookApiKey?.trim() || import.meta.env.VITE_PLANTBOOK_API_KEY?.trim() || undefined
}

async function request<T>(path: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  let response: Response
  try {
    response = await fetchImpl(`${API_BASE}${path}`, { headers: { Authorization: `Token ${apiKey}` } })
  } catch {
    throw new PlantbookError('No se pudo conectar con Open Plantbook. ¿Tienes conexión a internet?')
  }
  if (response.status === 401 || response.status === 403) {
    throw new PlantbookError('La API key de Open Plantbook no es válida.')
  }
  if (!response.ok) throw new PlantbookError(`Open Plantbook respondió con un error (${response.status}).`)
  return response.json() as Promise<T>
}

export async function searchPlantbook(query: string, apiKey: string, fetchImpl?: typeof fetch) {
  const data = await request<{ results: PlantbookSearchResult[] }>(
    `/plant/search?alias=${encodeURIComponent(query)}&limit=15`,
    apiKey,
    fetchImpl,
  )
  return data.results ?? []
}

export async function getPlantbookDetail(pid: string, apiKey: string, fetchImpl?: typeof fetch) {
  return request<PlantbookDetail>(`/plant/detail/${encodeURIComponent(pid)}/`, apiKey, fetchImpl)
}

function lightFromLux(maxLux: number): LightLevel {
  if (maxLux >= 60_000) return 'sol-directo'
  if (maxLux >= 20_000) return 'indirecta-brillante'
  if (maxLux >= 8_000) return 'media'
  return 'baja'
}

function humidityFromPercent(minHumidity: number): HumidityLevel {
  if (minHumidity >= 60) return 'alta'
  if (minHumidity >= 40) return 'media'
  return 'baja'
}

/** Estimación del riego (verano, invierno) según la humedad de suelo máxima recomendada. */
function wateringFromSoil(maxSoilMoisture: number): [number, number] {
  if (maxSoilMoisture <= 35) return [14, 28] // le gusta la tierra seca (cactus, suculentas)
  if (maxSoilMoisture <= 55) return [8, 15]
  return [5, 9] // tierra siempre algo húmeda
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Convierte la ficha de Plantbook al formato de especie de la app. */
export function plantbookToSpecies(detail: PlantbookDetail): Species {
  const [summer, winter] = wateringFromSoil(detail.max_soil_moist)
  return {
    id: `plantbook:${detail.pid}`,
    commonName: capitalize(detail.alias || detail.display_pid),
    scientificName: detail.display_pid,
    light: lightFromLux(detail.max_light_lux),
    humidity: humidityFromPercent(detail.min_env_humid),
    tempMin: Math.round(detail.min_temp),
    tempMax: Math.round(detail.max_temp),
    waterDaysSummer: summer,
    waterDaysWinter: winter,
    difficulty: 'media',
    petToxic: null,
    tip: 'Datos de Open Plantbook. El intervalo de riego es una estimación: ajústalo según cómo veas la tierra.',
    source: 'plantbook',
  }
}

import { db, type PlantDB } from '../db/db'
import type { DiagnosisRecord, Plant, Settings, Species, WateringEvent } from '../types'

// Copia de seguridad: todos los datos en un único archivo JSON (las fotos van
// dentro, en base64), para guardarlo o pasarlo a otro dispositivo.

export const BACKUP_APP = 'mis-plantas'
export const BACKUP_VERSION = 1

/** Ajustes que no se exportan: claves personales y estado interno. */
const PRIVATE_SETTINGS: (keyof Settings)[] = ['plantbookApiKey', 'lastNotifiedDay']

type WithPhoto<T> = Omit<T, 'photo'> & { photo?: string }

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  plants: WithPhoto<Plant>[]
  wateringEvents: WateringEvent[]
  diagnoses: WithPhoto<DiagnosisRecord>[]
  customSpecies: Species[]
  settings: Partial<Settings>
}

export interface BackupSummary {
  plants: number
  wateringEvents: number
  diagnoses: number
  customSpecies: number
}

export type ImportMode = 'combinar' | 'reemplazar'

export class BackupError extends Error {}

// ─── Fotos ⇄ texto ───────────────────────────────────────────────────────────

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match || !match[2]) throw new BackupError('Una de las fotos del archivo está dañada.')
  const binary = atob(match[3])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: match[1] })
}

async function withPhotoAsText<T extends { photo?: Blob }>(item: T): Promise<WithPhoto<T>> {
  const { photo, ...rest } = item
  return photo ? { ...rest, photo: await blobToDataUrl(photo) } : rest
}

function withPhotoAsBlob<T extends { photo?: Blob }>(item: WithPhoto<T>): T {
  const { photo, ...rest } = item
  return (photo ? { ...rest, photo: dataUrlToBlob(photo) } : rest) as T
}

// ─── Exportar ────────────────────────────────────────────────────────────────

export async function exportBackup(database: PlantDB = db, now = new Date()): Promise<BackupFile> {
  const [plants, wateringEvents, diagnoses, customSpecies, settingRows] = await Promise.all([
    database.plants.toArray(),
    database.wateringEvents.toArray(),
    database.diagnoses.toArray(),
    database.customSpecies.toArray(),
    database.settings.toArray(),
  ])
  const settings = Object.fromEntries(
    settingRows.filter((r) => !PRIVATE_SETTINGS.includes(r.key as keyof Settings)).map((r) => [r.key, r.value]),
  ) as Partial<Settings>

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    plants: await Promise.all(plants.map(withPhotoAsText)),
    wateringEvents,
    diagnoses: await Promise.all(diagnoses.map(withPhotoAsText)),
    customSpecies,
    settings,
  }
}

export function backupFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `mis-plantas-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

// ─── Importar ────────────────────────────────────────────────────────────────

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const hasStrings = (v: Record<string, unknown>, keys: string[]) => keys.every((k) => typeof v[k] === 'string')

/** Lee y valida el contenido de un archivo de copia de seguridad. */
export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('El archivo no es una copia de seguridad válida (no es JSON).')
  }
  if (!isObject(data) || data.app !== BACKUP_APP) {
    throw new BackupError('Este archivo no es una copia de seguridad de Mis Plantas.')
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new BackupError('La copia es de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.')
  }
  for (const key of ['plants', 'wateringEvents', 'diagnoses', 'customSpecies'] as const) {
    if (!Array.isArray(data[key]) || !(data[key] as unknown[]).every(isObject)) throw new BackupError(`El archivo está dañado (${key}).`)
  }
  const file = data as unknown as BackupFile
  if (!file.plants.every((p) => hasStrings(p as never, ['id', 'nickname', 'room', 'potType', 'potSize', 'createdAt', 'updatedAt']))) {
    throw new BackupError('El archivo está dañado: hay plantas incompletas.')
  }
  if (!file.wateringEvents.every((e) => hasStrings(e as never, ['id', 'plantId', 'date', 'kind']))) {
    throw new BackupError('El archivo está dañado: hay riegos incompletos.')
  }
  if (!file.diagnoses.every((d) => hasStrings(d as never, ['id', 'plantId', 'date']) && Array.isArray(d.results))) {
    throw new BackupError('El archivo está dañado: hay diagnósticos incompletos.')
  }
  if (!file.customSpecies.every((s) => hasStrings(s as never, ['id', 'commonName', 'scientificName']))) {
    throw new BackupError('El archivo está dañado: hay especies incompletas.')
  }
  if (!isObject(file.settings)) file.settings = {}
  return file
}

export function summarize(file: Pick<BackupFile, keyof BackupSummary>): BackupSummary {
  return {
    plants: file.plants.length,
    wateringEvents: file.wateringEvents.length,
    diagnoses: file.diagnoses.length,
    customSpecies: file.customSpecies.length,
  }
}

/**
 * Importa una copia.
 *  · reemplazar: borra todo lo que hay en este dispositivo y deja solo lo de la copia.
 *  · combinar: añade lo de la copia; si una planta existe en los dos sitios,
 *    se queda la versión editada más recientemente. Importar dos veces el
 *    mismo archivo no duplica nada.
 */
export async function importBackup(file: BackupFile, mode: ImportMode, database: PlantDB = db): Promise<BackupSummary> {
  // Las fotos se convierten antes de abrir la transacción (IndexedDB no admite esperas externas dentro).
  const plants = file.plants.map((p) => withPhotoAsBlob<Plant>(p))
  const diagnoses = file.diagnoses.map((d) => withPhotoAsBlob<DiagnosisRecord>(d))
  const tables = [database.plants, database.wateringEvents, database.diagnoses, database.customSpecies, database.settings]

  await database.transaction('rw', tables, async () => {
    let plantsToSave = plants
    if (mode === 'reemplazar') {
      // Se conservan las claves personales de este dispositivo.
      const kept = await database.settings.where('key').anyOf(PRIVATE_SETTINGS).toArray()
      await Promise.all(tables.map((t) => t.clear()))
      await database.settings.bulkPut(kept)
    } else {
      const existing = new Map((await database.plants.bulkGet(plants.map((p) => p.id))).filter(Boolean).map((p) => [p!.id, p!]))
      plantsToSave = plants.filter((p) => {
        const current = existing.get(p.id)
        return !current || p.updatedAt >= current.updatedAt
      })
    }
    await database.plants.bulkPut(plantsToSave)
    await database.wateringEvents.bulkPut(file.wateringEvents)
    await database.diagnoses.bulkPut(diagnoses)
    await database.customSpecies.bulkPut(file.customSpecies)
    const settings = Object.entries(file.settings).filter(([key]) => !PRIVATE_SETTINGS.includes(key as keyof Settings))
    await database.settings.bulkPut(settings.map(([key, value]) => ({ key, value })))
  })
  return summarize(file)
}

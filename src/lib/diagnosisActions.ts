import { db, type PlantDB } from '../db/db'
import type { DiagnosisRecord } from '../types'

/** Guarda (o actualiza, si ya existe) un diagnóstico en el historial de la planta. */
export async function saveDiagnosis(record: DiagnosisRecord, database: PlantDB = db) {
  await database.diagnoses.put(record)
}

export async function deleteDiagnosis(id: string, database: PlantDB = db) {
  await database.diagnoses.delete(id)
}

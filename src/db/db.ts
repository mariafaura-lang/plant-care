import Dexie, { type Table } from 'dexie'
import type { DiagnosisRecord, Plant, Species, WateringEvent } from '../types'

export interface SettingEntry {
  key: string
  value: unknown
}

export const DB_NAME = 'plant-care-db'

export class PlantDB extends Dexie {
  plants!: Table<Plant, string>
  wateringEvents!: Table<WateringEvent, string>
  diagnoses!: Table<DiagnosisRecord, string>
  /** Especies que no están en species.json (añadidas a mano o desde Open Plantbook). */
  customSpecies!: Table<Species, string>
  settings!: Table<SettingEntry, string>

  constructor(name = DB_NAME) {
    super(name)
    // Cada cambio de esquema debe ir en una versión NUEVA (this.version(2)…),
    // nunca editando esta: así los datos de quien ya usa la app se migran solos.
    this.version(1).stores({
      plants: 'id, room, speciesId, nickname, updatedAt',
      wateringEvents: 'id, plantId, date, [plantId+date]',
      diagnoses: 'id, plantId, date',
      customSpecies: 'id, commonName',
      settings: 'key',
    })
  }
}

export const db = new PlantDB()

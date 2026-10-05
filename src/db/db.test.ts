import { afterEach, describe, expect, it } from 'vitest'
import { loadSettings, saveSetting } from '../lib/settings'
import { DEFAULT_SETTINGS } from '../types'
import { PlantDB } from './db'

let database: PlantDB

afterEach(async () => {
  await database?.delete()
})

describe('PlantDB', () => {
  it('guarda una planta y sus riegos, y los consulta por planta', async () => {
    database = new PlantDB('test-plants')
    const now = new Date().toISOString()
    await database.plants.add({
      id: 'p1',
      nickname: 'Monsti',
      speciesId: 'monstera-deliciosa',
      room: 'Salón',
      potType: 'plastico',
      potSize: 'mediana',
      createdAt: now,
      updatedAt: now,
    })
    await database.wateringEvents.bulkAdd([
      { id: 'w1', plantId: 'p1', date: '2026-09-20T09:00:00.000Z', kind: 'regada' },
      { id: 'w2', plantId: 'p1', date: '2026-09-28T09:00:00.000Z', kind: 'regada' },
      { id: 'w3', plantId: 'otra', date: '2026-09-28T09:00:00.000Z', kind: 'regada' },
    ])

    expect(await database.plants.where('room').equals('Salón').count()).toBe(1)
    const events = await database.wateringEvents.where('plantId').equals('p1').sortBy('date')
    expect(events.map((e) => e.id)).toEqual(['w1', 'w2'])
  })

  it('devuelve los ajustes por defecto y guarda cambios', async () => {
    database = new PlantDB('test-settings')
    expect(await loadSettings(database)).toEqual(DEFAULT_SETTINGS)
    await saveSetting('hemisphere', 'sur', database)
    expect((await loadSettings(database)).hemisphere).toBe('sur')
  })
})

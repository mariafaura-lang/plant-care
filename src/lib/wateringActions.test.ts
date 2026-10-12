import { afterEach, describe, expect, it } from 'vitest'
import { PlantDB } from '../db/db'
import { addPastWatering, deleteWateringEvent, setWateringFactor, snoozePlant, waterPlants } from './wateringActions'

let database: PlantDB
afterEach(async () => {
  await database?.delete()
})

async function setup() {
  database = new PlantDB(`test-actions-${Math.random()}`)
  const now = new Date().toISOString()
  for (const id of ['a', 'b']) {
    await database.plants.add({ id, nickname: id, room: 'Salón', potType: 'plastico', potSize: 'mediana', createdAt: now, updatedAt: now })
  }
}

describe('acciones de riego', () => {
  it('"Más tarde" pospone 1-3 días y lo registra; regar lo anula', async () => {
    await setup()
    const now = new Date(2026, 6, 20, 10)
    await snoozePlant('a', 2, now, database)
    expect((await database.plants.get('a'))?.snoozedUntil).toBe('2026-07-22')
    await snoozePlant('b', 10, now, database)
    expect((await database.plants.get('b'))?.snoozedUntil).toBe('2026-07-23')

    await waterPlants(['a', 'b'], now, database)
    expect((await database.plants.get('a'))?.snoozedUntil).toBeUndefined()
    const events = await database.wateringEvents.toArray()
    expect(events.filter((e) => e.kind === 'pospuesta')).toHaveLength(2)
    expect(events.filter((e) => e.kind === 'regada').map((e) => e.plantId).sort()).toEqual(['a', 'b'])
  })

  it('se puede deshacer un riego, recuperando el "Más tarde"', async () => {
    await setup()
    const now = new Date(2026, 6, 20, 10)
    await snoozePlant('a', 1, now, database)
    const undo = await waterPlants(['a'], now, database)
    await undo()
    expect((await database.wateringEvents.toArray()).map((e) => e.kind)).toEqual(['pospuesta'])
    expect((await database.plants.get('a'))?.snoozedUntil).toBe('2026-07-21')
  })

  it('registra riegos pasados y permite borrarlos', async () => {
    await setup()
    await addPastWatering('a', '2026-07-01', database)
    const [event] = await database.wateringEvents.toArray()
    expect(new Date(event.date).getDate()).toBe(1)
    await deleteWateringEvent(event.id, database)
    expect(await database.wateringEvents.count()).toBe(0)
  })

  it('guarda y quita el ajuste personal, dentro de los límites', async () => {
    await setup()
    await setWateringFactor('a', 0.1, database)
    expect((await database.plants.get('a'))?.wateringFactor).toBe(0.4)
    await setWateringFactor('a', undefined, database)
    expect((await database.plants.get('a'))?.wateringFactor).toBeUndefined()
  })
})

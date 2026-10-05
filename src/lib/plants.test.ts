import { afterEach, describe, expect, it } from 'vitest'
import { PlantDB } from '../db/db'
import type { Plant } from '../types'
import { createPlant, deletePlant, filterPlants, groupByRoom, roomSuggestions, updatePlant, type PlantInput } from './plants'
import { CATALOG } from './species'

const base: PlantInput = { nickname: 'Monsti', speciesId: 'monstera-deliciosa', room: 'Salón', potType: 'plastico', potSize: 'mediana' }

const plant = (over: Partial<Plant>): Plant => ({
  id: over.nickname ?? 'x',
  ...base,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

let database: PlantDB
afterEach(async () => {
  await database?.delete()
})

describe('crear, editar y borrar plantas', () => {
  it('crea limpiando espacios y deja la habitación por defecto', async () => {
    database = new PlantDB('test-create')
    const id = await createPlant({ ...base, nickname: '  Monsti ', room: '  ', notes: '   ' }, database)
    const saved = await database.plants.get(id)
    expect(saved?.nickname).toBe('Monsti')
    expect(saved?.room).toBe('Sin habitación')
    expect(saved).not.toHaveProperty('notes')
  })

  it('al editar conserva la fecha de creación y borra campos vaciados', async () => {
    database = new PlantDB('test-update')
    const id = await createPlant({ ...base, notes: 'junto a la ventana' }, database)
    const before = await database.plants.get(id)
    await updatePlant(id, { ...base, nickname: 'Monstera grande', notes: '' }, database)
    const after = await database.plants.get(id)
    expect(after?.nickname).toBe('Monstera grande')
    expect(after?.createdAt).toBe(before?.createdAt)
    expect(after?.notes).toBeUndefined()
  })

  it('al borrar elimina también sus riegos y diagnósticos', async () => {
    database = new PlantDB('test-delete')
    const id = await createPlant(base, database)
    const other = await createPlant({ ...base, nickname: 'Otra' }, database)
    await database.wateringEvents.bulkAdd([
      { id: 'w1', plantId: id, date: '2026-09-01T10:00:00.000Z', kind: 'regada' },
      { id: 'w2', plantId: other, date: '2026-09-01T10:00:00.000Z', kind: 'regada' },
    ])
    await database.diagnoses.add({ id: 'd1', plantId: id, date: '2026-09-02T10:00:00.000Z', symptoms: [], answers: {}, results: [] })

    await deletePlant(id, database)
    expect(await database.plants.get(id)).toBeUndefined()
    expect(await database.wateringEvents.count()).toBe(1)
    expect(await database.diagnoses.count()).toBe(0)
  })
})

describe('buscar y agrupar', () => {
  const plants = [
    plant({ nickname: 'Rosa', room: 'Dormitorio', speciesId: 'orquidea-phalaenopsis' }),
    plant({ nickname: 'Pepe', room: 'Salón', speciesId: 'pothos' }),
    plant({ nickname: 'Ana', room: 'Salón', speciesId: 'sansevieria', notes: 'Regalo de la abuela' }),
  ]

  it('busca por apodo, habitación, notas y especie', () => {
    expect(filterPlants(plants, 'pepe', CATALOG).map((p) => p.nickname)).toEqual(['Pepe'])
    expect(filterPlants(plants, 'salon', CATALOG)).toHaveLength(2)
    expect(filterPlants(plants, 'abuela', CATALOG).map((p) => p.nickname)).toEqual(['Ana'])
    expect(filterPlants(plants, 'orquídea', CATALOG).map((p) => p.nickname)).toEqual(['Rosa'])
    expect(filterPlants(plants, 'lengua de suegra', CATALOG).map((p) => p.nickname)).toEqual(['Ana'])
    expect(filterPlants(plants, '', CATALOG)).toHaveLength(3)
  })

  it('agrupa por habitación en orden alfabético', () => {
    const groups = groupByRoom(plants)
    expect(groups.map((g) => g.room)).toEqual(['Dormitorio', 'Salón'])
    expect(groups[1].plants.map((p) => p.nickname)).toEqual(['Ana', 'Pepe'])
  })

  it('sugiere habitaciones sin duplicados', () => {
    const rooms = roomSuggestions([plant({ room: 'salon' }), plant({ room: 'Galería' })])
    expect(rooms[0]).toBe('salon')
    expect(rooms).toContain('Galería')
    expect(rooms).not.toContain('Salón')
    expect(rooms).toContain('Cocina')
  })
})

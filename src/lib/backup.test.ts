import { afterEach, describe, expect, it } from 'vitest'
import { PlantDB } from '../db/db'
import type { Plant } from '../types'
import { BackupError, backupFilename, blobToDataUrl, dataUrlToBlob, exportBackup, importBackup, parseBackup } from './backup'

const databases: PlantDB[] = []
const newDb = () => {
  const d = new PlantDB(`test-backup-${Math.random()}`)
  databases.push(d)
  return d
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((d) => d.delete()))
})

const plant = (id: string, over: Partial<Plant> = {}): Plant => ({
  id,
  nickname: id,
  room: 'Salón',
  potType: 'barro',
  potSize: 'pequena',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

async function seed(database: PlantDB) {
  const photo = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 250])], { type: 'image/jpeg' })
  await database.plants.bulkAdd([plant('a', { photo, speciesId: 'pothos', notes: 'Con foto' }), plant('b')])
  await database.wateringEvents.add({ id: 'w1', plantId: 'a', date: '2026-09-01T10:00:00.000Z', kind: 'regada' })
  await database.diagnoses.add({ id: 'd1', plantId: 'a', date: '2026-09-02T10:00:00.000Z', symptoms: ['manchas'], answers: {}, results: [] })
  await database.customSpecies.add({
    id: 'plantbook:x',
    commonName: 'X',
    scientificName: 'X x',
    light: 'media',
    humidity: 'media',
    tempMin: 10,
    tempMax: 30,
    waterDaysSummer: 7,
    waterDaysWinter: 14,
    difficulty: 'media',
    petToxic: null,
    tip: 'Consejo',
    source: 'plantbook',
  })
  await database.settings.bulkPut([
    { key: 'hemisphere', value: 'sur' },
    { key: 'plantbookApiKey', value: 'secreta' },
  ])
}

describe('fotos en base64', () => {
  it('convierte ida y vuelta sin perder bytes', async () => {
    const blob = new Blob([new Uint8Array([0, 1, 2, 253, 254, 255])], { type: 'image/png' })
    const url = await blobToDataUrl(blob)
    expect(url.startsWith('data:image/png;base64,')).toBe(true)
    const back = dataUrlToBlob(url)
    expect(back.type).toBe('image/png')
    expect([...new Uint8Array(await back.arrayBuffer())]).toEqual([0, 1, 2, 253, 254, 255])
  })
})

describe('exportar e importar', () => {
  it('pasa todos los datos a otro dispositivo, fotos incluidas, sin la API key', async () => {
    const origin = newDb()
    await seed(origin)
    const file = await exportBackup(origin, new Date('2026-10-06T10:00:00Z'))
    const text = JSON.stringify(file)
    expect(text).not.toContain('secreta')
    expect(file.plants.find((p) => p.id === 'a')?.photo).toMatch(/^data:image\/jpeg;base64,/)

    const target = newDb()
    const summary = await importBackup(parseBackup(text), 'reemplazar', target)
    expect(summary).toEqual({ plants: 2, wateringEvents: 1, diagnoses: 1, customSpecies: 1 })

    const a = await target.plants.get('a')
    expect(a?.notes).toBe('Con foto')
    expect(a?.photo).toBeInstanceOf(Blob)
    expect([...new Uint8Array(await a!.photo!.arrayBuffer())]).toEqual([0xff, 0xd8, 0xff, 1, 2, 3, 250])
    expect(await target.wateringEvents.count()).toBe(1)
    expect(await target.diagnoses.count()).toBe(1)
    expect((await target.customSpecies.get('plantbook:x'))?.petToxic).toBeNull()
    expect((await target.settings.get('hemisphere'))?.value).toBe('sur')
    expect(await target.settings.get('plantbookApiKey')).toBeUndefined()
  })

  it('"reemplazar" borra lo que había pero conserva la API key del dispositivo', async () => {
    const origin = newDb()
    await origin.plants.add(plant('nueva'))
    const file = await exportBackup(origin)

    const target = newDb()
    await seed(target)
    await importBackup(file, 'reemplazar', target)
    expect((await target.plants.toArray()).map((p) => p.id)).toEqual(['nueva'])
    expect(await target.wateringEvents.count()).toBe(0)
    expect((await target.settings.get('plantbookApiKey'))?.value).toBe('secreta')
  })

  it('"combinar" suma datos, se queda con la edición más reciente y no duplica al repetir', async () => {
    const origin = newDb()
    await origin.plants.bulkAdd([
      plant('a', { nickname: 'Antigua', updatedAt: '2026-01-01T00:00:00.000Z' }),
      plant('c', { nickname: 'Solo en la copia' }),
      plant('b', { nickname: 'B editada en la copia', updatedAt: '2026-05-01T00:00:00.000Z' }),
    ])
    const file = await exportBackup(origin)

    const target = newDb()
    await target.plants.bulkAdd([plant('a', { nickname: 'Reciente', updatedAt: '2026-06-01T00:00:00.000Z' }), plant('b')])
    await importBackup(file, 'combinar', target)
    await importBackup(file, 'combinar', target)

    const byId = Object.fromEntries((await target.plants.toArray()).map((p) => [p.id, p.nickname]))
    expect(byId).toEqual({ a: 'Reciente', b: 'B editada en la copia', c: 'Solo en la copia' })
  })

  it('nombra el archivo con la fecha', () => {
    expect(backupFilename(new Date(2026, 9, 6))).toBe('mis-plantas-2026-10-06.json')
  })
})

describe('archivos no válidos', () => {
  it.each([
    ['no es JSON', 'hola', /no es JSON/],
    ['otra app', JSON.stringify({ app: 'gymlog', version: 1 }), /no es una copia de seguridad de Mis Plantas/],
    ['versión futura', JSON.stringify({ app: 'mis-plantas', version: 99 }), /versión más nueva/],
    ['faltan tablas', JSON.stringify({ app: 'mis-plantas', version: 1, plants: [] }), /dañado/],
    [
      'planta incompleta',
      JSON.stringify({ app: 'mis-plantas', version: 1, plants: [{ id: 'x' }], wateringEvents: [], diagnoses: [], customSpecies: [] }),
      /plantas incompletas/,
    ],
  ])('rechaza: %s', (_name, text, message) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
    expect(() => parseBackup(text)).toThrow(message)
  })

  it('rechaza una foto dañada', () => {
    expect(() => dataUrlToBlob('data:image/jpeg,sin-base64')).toThrow(/dañada/)
  })
})

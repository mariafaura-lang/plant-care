import { describe, expect, it } from 'vitest'
import { CATALOG, normalizeText, searchSpecies } from './species'

const LIGHT = ['baja', 'media', 'indirecta-brillante', 'sol-directo']
const HUMIDITY = ['baja', 'media', 'alta']
const DIFFICULTY = ['facil', 'media', 'dificil']

describe('catálogo de especies', () => {
  it('tiene entre 40 y 60 especies con ids únicos', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(40)
    expect(CATALOG.length).toBeLessThanOrEqual(60)
    expect(new Set(CATALOG.map((s) => s.id)).size).toBe(CATALOG.length)
  })

  it.each(CATALOG.map((s) => [s.id, s] as const))('%s tiene datos válidos', (_id, s) => {
    expect(s.commonName.trim()).not.toBe('')
    expect(s.scientificName.trim()).not.toBe('')
    expect(LIGHT).toContain(s.light)
    expect(HUMIDITY).toContain(s.humidity)
    expect(DIFFICULTY).toContain(s.difficulty)
    expect(s.tempMin).toBeLessThan(s.tempMax)
    expect(s.waterDaysSummer).toBeGreaterThanOrEqual(1)
    // En invierno se riega igual o menos a menudo que en verano.
    expect(s.waterDaysWinter).toBeGreaterThanOrEqual(s.waterDaysSummer)
    expect(typeof s.petToxic).toBe('boolean')
    expect(s.tip.length).toBeGreaterThan(20)
  })

  it('incluye las especies pedidas', () => {
    const ids = CATALOG.map((s) => s.id)
    for (const id of ['monstera-deliciosa', 'pothos', 'sansevieria', 'ficus-lyrata', 'calathea', 'zamioculca', 'cactus', 'suculentas', 'orquidea-phalaenopsis', 'espatifilo']) {
      expect(ids).toContain(id)
    }
  })
})

describe('searchSpecies', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizeText('  Árbol de JADE ')).toBe('arbol de jade')
    expect(searchSpecies(CATALOG, 'arbol de jade')[0].id).toBe('arbol-de-jade')
  })

  it('encuentra por otros nombres y por nombre científico', () => {
    expect(searchSpecies(CATALOG, 'poto').map((s) => s.id)).toContain('pothos')
    expect(searchSpecies(CATALOG, 'lengua de suegra')[0].id).toBe('sansevieria')
    expect(searchSpecies(CATALOG, 'Zamioculcas zamiifolia')[0].id).toBe('zamioculca')
  })

  it('pone primero las que empiezan por el texto', () => {
    const results = searchSpecies(CATALOG, 'ficus')
    expect(results.slice(0, 4).every((s) => s.commonName.startsWith('Ficus'))).toBe(true)
  })

  it('sin texto devuelve todo ordenado alfabéticamente', () => {
    const all = searchSpecies(CATALOG, '')
    expect(all).toHaveLength(CATALOG.length)
    expect(all[0].commonName.localeCompare(all[1].commonName, 'es')).toBeLessThanOrEqual(0)
  })

  it('devuelve vacío si no hay coincidencias', () => {
    expect(searchSpecies(CATALOG, 'xyzxyz')).toEqual([])
  })
})

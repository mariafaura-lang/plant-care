import { describe, expect, it, vi } from 'vitest'
import { PlantbookError, plantbookToSpecies, searchPlantbook, type PlantbookDetail } from './plantbook'

const detail: PlantbookDetail = {
  pid: 'ctenanthe burle-marxii',
  display_pid: 'Ctenanthe burle-marxii',
  alias: 'ctenanthe',
  max_light_lux: 25000,
  min_light_lux: 1500,
  max_temp: 32,
  min_temp: 12,
  max_env_humid: 85,
  min_env_humid: 60,
  max_soil_moist: 60,
  min_soil_moist: 20,
}

describe('Open Plantbook', () => {
  it('convierte una ficha al formato de especie', () => {
    const s = plantbookToSpecies(detail)
    expect(s).toMatchObject({
      id: 'plantbook:ctenanthe burle-marxii',
      commonName: 'Ctenanthe',
      scientificName: 'Ctenanthe burle-marxii',
      light: 'indirecta-brillante',
      humidity: 'alta',
      tempMin: 12,
      tempMax: 32,
      waterDaysSummer: 5,
      waterDaysWinter: 9,
      petToxic: null,
      source: 'plantbook',
    })
  })

  it('estima riego espaciado para plantas de tierra seca', () => {
    const s = plantbookToSpecies({ ...detail, max_soil_moist: 30, max_light_lux: 80000, min_env_humid: 20 })
    expect([s.waterDaysSummer, s.waterDaysWinter]).toEqual([14, 28])
    expect(s.light).toBe('sol-directo')
    expect(s.humidity).toBe('baja')
  })

  it('envía la key y devuelve los resultados', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{ pid: 'a', display_pid: 'A', alias: 'a' }] })))
    const results = await searchPlantbook('ctenanthe', 'mi-key', fetchMock)
    expect(results).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/plant/search?alias=ctenanthe')
    expect(init.headers).toEqual({ Authorization: 'Token mi-key' })
  })

  it('da un error claro si la key no es válida o no hay conexión', async () => {
    await expect(searchPlantbook('x', 'mala', async () => new Response('', { status: 401 }))).rejects.toThrow(/no es válida/)
    await expect(
      searchPlantbook('x', 'k', async () => {
        throw new TypeError('Failed to fetch')
      }),
    ).rejects.toBeInstanceOf(PlantbookError)
  })
})

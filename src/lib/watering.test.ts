import { describe, expect, it } from 'vitest'
import type { Plant, Species, WateringEvent } from '../types'
import {
  adaptiveSuggestion,
  buildSchedule,
  groupSchedule,
  plantSchedule,
  seasonName,
  summerWeight,
  wateredDays,
  wateringInterval,
} from './watering'

const species: Species = {
  id: 'sp',
  commonName: 'Prueba',
  scientificName: 'Plantus testus',
  light: 'media',
  humidity: 'media',
  tempMin: 15,
  tempMax: 30,
  waterDaysSummer: 7,
  waterDaysWinter: 14,
  difficulty: 'facil',
  petToxic: false,
  tip: 'Consejo de prueba suficientemente largo.',
}

const plant = (over: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  nickname: 'Planta',
  speciesId: 'sp',
  room: 'Salón',
  potType: 'ceramica',
  potSize: 'mediana',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

let n = 0
const watered = (day: string, plantId = 'p1'): WateringEvent => ({ id: `e${n++}`, plantId, date: `${day}T10:00:00`, kind: 'regada' })

describe('estación', () => {
  it('es pleno invierno a mediados de enero y pleno verano a mediados de julio (norte)', () => {
    expect(summerWeight('2026-01-15', 'norte')).toBeCloseTo(0, 2)
    expect(summerWeight('2026-07-16', 'norte')).toBeCloseTo(1, 2)
    expect(summerWeight('2026-04-15', 'norte')).toBeCloseTo(0.5, 1)
  })

  it('invierte las estaciones en el hemisferio sur', () => {
    expect(summerWeight('2026-01-15', 'sur')).toBeCloseTo(1, 2)
    expect(summerWeight('2026-07-16', 'sur')).toBeCloseTo(0, 2)
  })

  it('nombra la estación', () => {
    expect(seasonName('2026-01-10', 'norte')).toBe('invierno')
    expect(seasonName('2026-12-22', 'norte')).toBe('invierno')
    expect(seasonName('2026-04-10', 'norte')).toBe('primavera')
    expect(seasonName('2026-08-10', 'norte')).toBe('verano')
    expect(seasonName('2026-10-05', 'norte')).toBe('otoño')
    expect(seasonName('2026-01-10', 'sur')).toBe('verano')
    expect(seasonName('2026-10-05', 'sur')).toBe('primavera')
  })
})

describe('wateringInterval', () => {
  it('usa el intervalo de verano en verano y el de invierno en invierno', () => {
    expect(wateringInterval(plant(), species, '2026-07-16', 'norte').days).toBe(7)
    expect(wateringInterval(plant(), species, '2026-01-15', 'norte').days).toBe(14)
  })

  it('interpola en primavera y otoño', () => {
    const days = wateringInterval(plant(), species, '2026-10-15', 'norte').days
    expect(days).toBeGreaterThan(7)
    expect(days).toBeLessThan(14)
  })

  it('el barro y las macetas pequeñas acortan el intervalo; el plástico y las grandes lo alargan', () => {
    const date = '2026-07-16'
    const base = wateringInterval(plant(), species, date, 'norte').raw
    expect(wateringInterval(plant({ potType: 'barro' }), species, date, 'norte').raw).toBeCloseTo(base * 0.8)
    expect(wateringInterval(plant({ potType: 'plastico' }), species, date, 'norte').raw).toBeCloseTo(base * 1.1)
    expect(wateringInterval(plant({ potSize: 'pequena' }), species, date, 'norte').raw).toBeCloseTo(base * 0.8)
    expect(wateringInterval(plant({ potSize: 'grande' }), species, date, 'norte').raw).toBeCloseTo(base * 1.25)
  })

  it('combina factores y aplica el ajuste personal', () => {
    // Invierno: 14 × 0,8 (barro) × 0,8 (pequeña) = 8,96 → 9
    expect(wateringInterval(plant({ potType: 'barro', potSize: 'pequena' }), species, '2026-01-15', 'norte').days).toBe(9)
    // Verano: 7 × 1,1 × 1,25 = 9,625 → 10; con ajuste 0,5 → 4,8 → 5
    expect(wateringInterval(plant({ potType: 'plastico', potSize: 'grande' }), species, '2026-07-16', 'norte').days).toBe(10)
    expect(wateringInterval(plant({ potType: 'plastico', potSize: 'grande', wateringFactor: 0.5 }), species, '2026-07-16', 'norte').days).toBe(5)
  })

  it('usa 7/14 días si no se sabe la especie', () => {
    expect(wateringInterval(plant(), undefined, '2026-07-16', 'norte').days).toBe(7)
    expect(wateringInterval(plant(), undefined, '2026-01-15', 'norte').days).toBe(14)
  })

  it('nunca baja de 1 día', () => {
    const thirsty = { ...species, waterDaysSummer: 1, waterDaysWinter: 1 }
    expect(wateringInterval(plant({ potType: 'barro', potSize: 'pequena', wateringFactor: 0.4 }), thirsty, '2026-07-16', 'norte').days).toBe(1)
  })
})

describe('plantSchedule', () => {
  const today = '2026-07-20'

  it('sin riegos registrados, toca hoy', () => {
    const s = plantSchedule(plant(), species, [], today, 'norte')
    expect(s.due).toBe(today)
    expect(s.status).toBe('hoy')
    expect(s.lastWatered).toBeUndefined()
  })

  it('calcula el próximo riego desde el último', () => {
    const s = plantSchedule(plant(), species, [watered('2026-07-10'), watered('2026-07-16')], today, 'norte')
    expect(s.lastWatered).toBe('2026-07-16')
    expect(s.due).toBe('2026-07-23')
    expect(s.daysUntil).toBe(3)
    expect(s.status).toBe('proxima')
  })

  it('marca atrasada si ya pasó el día', () => {
    const s = plantSchedule(plant(), species, [watered('2026-07-01')], today, 'norte')
    expect(s.due).toBe('2026-07-08')
    expect(s.daysUntil).toBe(-12)
    expect(s.status).toBe('atrasada')
  })

  it('ignora los "Más tarde" como riegos y respeta la fecha pospuesta', () => {
    const events: WateringEvent[] = [watered('2026-07-12'), { id: 'x', plantId: 'p1', date: '2026-07-19T09:00:00', kind: 'pospuesta', snoozeDays: 2 }]
    const s = plantSchedule(plant({ snoozedUntil: '2026-07-21' }), species, events, today, 'norte')
    expect(s.lastWatered).toBe('2026-07-12')
    expect(s.due).toBe('2026-07-21')
    expect(s.snoozed).toBe(true)
  })

  it('un "Más tarde" anterior al próximo riego no tiene efecto', () => {
    const s = plantSchedule(plant({ snoozedUntil: '2026-07-18' }), species, [watered('2026-07-19')], today, 'norte')
    expect(s.due).toBe('2026-07-26')
    expect(s.snoozed).toBe(false)
  })

  it('cuenta varios riegos el mismo día como uno', () => {
    expect(wateredDays([watered('2026-07-10'), watered('2026-07-10'), watered('2026-07-05')])).toEqual(['2026-07-05', '2026-07-10'])
  })
})

describe('buildSchedule y groupSchedule', () => {
  it('ordena por urgencia y separa atrasadas, hoy y próximos 7 días', () => {
    const today = '2026-07-20'
    const plants = [
      plant({ id: 'a', nickname: 'Atrasada' }),
      plant({ id: 'h', nickname: 'Hoy' }),
      plant({ id: 'p', nickname: 'Pronto' }),
      plant({ id: 'l', nickname: 'Lejos', speciesId: 'cactus' }),
    ]
    const cactus = { ...species, id: 'cactus', waterDaysSummer: 20, waterDaysWinter: 30 }
    const events = [watered('2026-07-05', 'a'), watered('2026-07-13', 'h'), watered('2026-07-15', 'p'), watered('2026-07-19', 'l')]
    const schedule = buildSchedule(plants, [species, cactus], events, today, 'norte')
    expect(schedule.map((s) => s.plant.nickname)).toEqual(['Atrasada', 'Hoy', 'Pronto', 'Lejos'])

    const groups = groupSchedule(schedule)
    expect(groups.overdue.map((s) => s.plant.id)).toEqual(['a'])
    expect(groups.today.map((s) => s.plant.id)).toEqual(['h'])
    expect(groups.upcoming).toEqual([{ day: '2026-07-22', entries: [schedule[2]] }])
  })
})

describe('adaptiveSuggestion', () => {
  const today = '2026-07-30'

  it('no sugiere nada con menos de 3 riegos', () => {
    expect(adaptiveSuggestion(plant(), species, [watered('2026-07-10'), watered('2026-07-14')], today, 'norte')).toBeNull()
  })

  it('sugiere regar más a menudo si siempre riegas antes de lo calculado', () => {
    // En pleno verano la app calcula 7 días; el usuario riega cada 4.
    const events = ['2026-07-10', '2026-07-14', '2026-07-18', '2026-07-22', '2026-07-26'].map((d) => watered(d))
    const s = adaptiveSuggestion(plant(), species, events, today, 'norte')
    expect(s).not.toBeNull()
    expect(s!.typicalDays).toBe(4)
    expect(s!.currentDays).toBe(7)
    expect(s!.suggestedDays).toBe(4)
    expect(s!.factor).toBeCloseTo(0.57, 1)
    expect(s!.samples).toBe(4)
  })

  it('sugiere espaciar si riegas más tarde de lo calculado', () => {
    const events = ['2026-06-01', '2026-06-12', '2026-06-23', '2026-07-04'].map((d) => watered(d))
    const s = adaptiveSuggestion(plant(), species, events, today, 'norte')
    expect(s!.suggestedDays).toBeGreaterThan(s!.currentDays)
  })

  it('no sugiere nada si ya riegas como calcula la app', () => {
    const events = ['2026-07-02', '2026-07-09', '2026-07-16', '2026-07-23'].map((d) => watered(d))
    expect(adaptiveSuggestion(plant(), species, events, today, 'norte')).toBeNull()
  })

  it('una vez aceptado el ajuste, deja de sugerirlo', () => {
    const events = ['2026-07-10', '2026-07-14', '2026-07-18', '2026-07-22', '2026-07-26'].map((d) => watered(d))
    const factor = adaptiveSuggestion(plant(), species, events, today, 'norte')!.factor
    expect(adaptiveSuggestion(plant({ wateringFactor: factor }), species, events, today, 'norte')).toBeNull()
  })

  it('unas vacaciones no descolocan la sugerencia (usa la mediana)', () => {
    const events = ['2026-06-01', '2026-06-08', '2026-06-15', '2026-07-15', '2026-07-22'].map((d) => watered(d))
    expect(adaptiveSuggestion(plant(), species, events, today, 'norte')).toBeNull()
  })

  it('compara en proporción, así sirve para riegos de invierno y de verano', () => {
    // Siempre riega a la mitad del intervalo calculado, en invierno y en verano.
    const winter = ['2026-01-05', '2026-01-12', '2026-01-19'].map((d) => watered(d)) // 7 días con 14 calculados
    const summer = ['2026-07-10', '2026-07-14'].map((d) => watered(d)) // ~3,5 con 7 calculados
    const s = adaptiveSuggestion(plant(), species, [...winter, ...summer], today, 'norte')
    expect(s!.factor).toBeLessThan(0.65)
  })
})

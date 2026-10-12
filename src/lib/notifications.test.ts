import { describe, expect, it } from 'vitest'
import type { Plant } from '../types'
import { buildWateringCalendar, escapeText, foldLine } from './ics'
import { notificationMessage, shouldNotify } from './notifications'
import { plantSchedule } from './watering'

const plant = (nickname: string): Plant => ({
  id: nickname,
  nickname,
  room: 'Salón',
  potType: 'ceramica',
  potSize: 'mediana',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})
const entry = (name: string, lastWatered?: string) =>
  plantSchedule(plant(name), undefined, lastWatered ? [{ id: name, plantId: name, date: `${lastWatered}T10:00:00`, kind: 'regada' }] : [], '2026-07-20', 'norte')

describe('shouldNotify', () => {
  const settings = { notificationsEnabled: true, notificationHour: 9 }
  const morning = new Date(2026, 6, 20, 10)

  it('avisa una vez al día, a partir de la hora elegida, si hay plantas pendientes', () => {
    expect(shouldNotify(settings, morning, '2026-07-20', 2)).toBe(true)
    expect(shouldNotify(settings, new Date(2026, 6, 20, 8), '2026-07-20', 2)).toBe(false)
    expect(shouldNotify({ ...settings, lastNotifiedDay: '2026-07-20' }, morning, '2026-07-20', 2)).toBe(false)
    expect(shouldNotify(settings, morning, '2026-07-20', 0)).toBe(false)
    expect(shouldNotify({ ...settings, notificationsEnabled: false }, morning, '2026-07-20', 2)).toBe(false)
  })
})

describe('notificationMessage', () => {
  it('nombra la planta si es solo una', () => {
    expect(notificationMessage([entry('Monsti')]).title).toBe('Hoy toca regar a Monsti')
  })

  it('resume si son muchas e indica las atrasadas', () => {
    const msg = notificationMessage([entry('A', '2026-07-01'), entry('B'), entry('C'), entry('D'), entry('E')])
    expect(msg.title).toBe('Hoy toca regar 5 plantas')
    expect(msg.body).toContain('A, B, C y 2 más')
    expect(msg.body).toContain('1 con retraso')
  })
})

describe('calendario .ics', () => {
  it('escapa texto y corta líneas largas sin romper caracteres', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
    const folded = foldLine('X'.repeat(70) + 'ñññññ')
    expect(folded.split('\r\n ').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true)
    expect(folded.replaceAll('\r\n ', '')).toBe('X'.repeat(70) + 'ñññññ')
  })

  it('crea un evento repetido por planta con su aviso', () => {
    const ics = buildWateringCalendar([entry('Monsti, la grande', '2026-07-18')], { notificationHour: 9, now: new Date(Date.UTC(2026, 6, 20, 8)) })
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260725')
    expect(ics).toContain('RRULE:FREQ=DAILY;INTERVAL=7')
    expect(ics).toContain('SUMMARY:💧 Regar Monsti\\, la grande')
    expect(ics).toContain('TRIGGER;RELATED=START:PT9H')
    expect(ics).toContain('DTSTAMP:20260720T080000Z')
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })
})

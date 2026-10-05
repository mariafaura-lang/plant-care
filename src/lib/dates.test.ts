import { describe, expect, it } from 'vitest'
import { addDays, dayOf, diffDays, parseISODate, toISODate } from './dates'

describe('dates', () => {
  it('formatea en hora local como YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('parsea un día y un ISO completo como medianoche local', () => {
    expect(parseISODate('2026-03-09').getDate()).toBe(9)
    expect(toISODate(parseISODate('2026-03-09T10:00:00.000Z'))).toBe('2026-03-09')
  })

  it('suma días cruzando meses, años y bisiestos', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('cuenta días enteros aunque haya cambio de hora', () => {
    // En España el horario de verano empieza el 29-03-2026 y acaba el 25-10-2026.
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2)
    expect(diffDays('2026-10-10', '2026-10-05')).toBe(-5)
  })

  it('obtiene el día local de un instante', () => {
    const instant = new Date(2026, 9, 5, 8, 30).toISOString()
    expect(dayOf(instant)).toBe('2026-10-05')
  })
})

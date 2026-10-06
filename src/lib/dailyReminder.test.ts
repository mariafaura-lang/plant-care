import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlantDB } from '../db/db'
import { runDailyReminder } from './dailyReminder'

let database: PlantDB
afterEach(async () => {
  await database?.delete()
})

async function setup(enabled = true) {
  database = new PlantDB(`test-reminder-${Math.random()}`)
  await database.settings.bulkPut([
    { key: 'notificationsEnabled', value: enabled },
    { key: 'notificationHour', value: 9 },
  ])
  const now = '2026-07-01T00:00:00.000Z'
  await database.plants.add({ id: 'p', nickname: 'Monsti', speciesId: 'monstera-deliciosa', room: 'Salón', potType: 'plastico', potSize: 'mediana', createdAt: now, updatedAt: now })
  await database.wateringEvents.add({ id: 'w', plantId: 'p', date: '2026-07-01T10:00:00', kind: 'regada' })
}

describe('aviso diario', () => {
  it('avisa de las plantas pendientes una sola vez al día', async () => {
    await setup()
    const show = vi.fn(async () => true)
    const morning = new Date(2026, 6, 20, 10)
    expect(await runDailyReminder(show, morning, database)).toBe(true)
    expect(show).toHaveBeenCalledWith('Hoy toca regar a Monsti', 'Va con retraso 💧')
    expect(await runDailyReminder(show, new Date(2026, 6, 20, 18), database)).toBe(false)
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('no avisa antes de la hora, si está desactivado o si no hay nada pendiente', async () => {
    await setup()
    const show = vi.fn(async () => true)
    expect(await runDailyReminder(show, new Date(2026, 6, 20, 7), database)).toBe(false)
    expect(await runDailyReminder(show, new Date(2026, 6, 2, 10), database)).toBe(false) // regada ayer
    await database.settings.put({ key: 'notificationsEnabled', value: false })
    expect(await runDailyReminder(show, new Date(2026, 6, 20, 10), database)).toBe(false)
    expect(show).not.toHaveBeenCalled()
  })

  it('si no se pudo mostrar, lo vuelve a intentar más tarde', async () => {
    await setup()
    expect(await runDailyReminder(async () => false, new Date(2026, 6, 20, 10), database)).toBe(false)
    expect(await runDailyReminder(async () => true, new Date(2026, 6, 20, 11), database)).toBe(true)
  })
})

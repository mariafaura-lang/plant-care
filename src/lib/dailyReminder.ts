import { db, type PlantDB } from '../db/db'
import { toISODate } from './dates'
import { notificationMessage, shouldNotify } from './reminderText'
import { loadSettings, saveSetting } from './settings'
import { CATALOG } from './species'
import { buildSchedule } from './watering'

/** Etiqueta del aviso en segundo plano (Periodic Background Sync). */
export const REMINDER_SYNC_TAG = 'aviso-riego-diario'

/**
 * Aviso diario de riego. Lo usan la app (al abrirla y mientras está abierta)
 * y el service worker (en segundo plano, donde el navegador lo permite).
 * Como ambos apuntan `lastNotifiedDay`, el aviso sale como mucho una vez al día.
 */
export async function runDailyReminder(
  show: (title: string, body: string) => Promise<boolean>,
  now: Date = new Date(),
  database: PlantDB = db,
): Promise<boolean> {
  const settings = await loadSettings(database)
  const today = toISODate(now)
  // Comprobación rápida antes de leer todas las plantas.
  if (!shouldNotify(settings, now, today, 1)) return false

  const [plants, events, custom] = await Promise.all([database.plants.toArray(), database.wateringEvents.toArray(), database.customSpecies.toArray()])
  const schedule = buildSchedule(plants, [...CATALOG, ...custom], events, today, settings.hemisphere)
  const pending = schedule.filter((e) => e.status === 'atrasada' || e.status === 'hoy')
  if (!shouldNotify(settings, now, today, pending.length)) return false

  const { title, body } = notificationMessage(pending)
  if (!(await show(title, body))) return false
  await saveSetting('lastNotifiedDay', today, database)
  return true
}

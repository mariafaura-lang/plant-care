import type { PlantSchedule } from './watering'

// Exporta el calendario de riego a un archivo .ics (Google Calendar, Apple
// Calendar, Outlook…). Cada planta es un evento de día completo que se repite
// cada N días a partir del próximo riego, con un aviso a la hora elegida.
// Es una foto del momento: si cambias el ritmo de riego, vuelve a exportarlo.

const icsDate = (isoDate: string) => isoDate.replaceAll('-', '')

const icsTimestamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Escapa texto según RFC 5545. */
export function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Corta líneas de más de 75 bytes (RFC 5545), sin partir caracteres multibyte. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74 // las líneas de continuación empiezan con un espacio
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export function buildWateringCalendar(schedule: PlantSchedule[], options: { notificationHour: number; now?: Date }): string {
  const stamp = icsTimestamp(options.now ?? new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mis Plantas//Riego//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Riego de mis plantas']

  for (const entry of schedule) {
    const { plant, species, interval, due } = entry
    const description = [
      species ? `${species.commonName} (${species.scientificName})` : null,
      `Habitación: ${plant.room}`,
      `Cada ${interval.days} días aprox. Si la tierra sigue húmeda, espera un par de días.`,
    ]
      .filter(Boolean)
      .join('\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:riego-${plant.id}@mis-plantas`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(due)}`,
      `RRULE:FREQ=DAILY;INTERVAL=${interval.days}`,
      `SUMMARY:${escapeText(`💧 Regar ${plant.nickname}`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`Regar ${plant.nickname}`)}`,
      `TRIGGER;RELATED=START:PT${options.notificationHour}H`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

/** Descarga un texto como archivo. */
export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

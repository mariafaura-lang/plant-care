import type { ReactNode } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, Segmented, TextInput } from '../components/ui/ui'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'
import { getPlantbookKey } from '../lib/integrations/plantbook'
import type { Hemisphere, ThemePreference } from '../types'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { settings, update } = useSettings()

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="space-y-3 px-4">
        <Section title="Apariencia">
          <Segmented<ThemePreference>
            label="Tema"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'sistema', label: 'Sistema' },
              { value: 'claro', label: 'Claro' },
              { value: 'oscuro', label: 'Oscuro' },
            ]}
          />
        </Section>

        {settings && (
          <Section title="Hemisferio" description="Para saber cuándo es verano o invierno y ajustar el riego.">
            <Segmented<Hemisphere>
              label="Hemisferio"
              value={settings.hemisphere}
              onChange={(v) => update('hemisphere', v)}
              options={[
                { value: 'norte', label: 'Norte (España…)' },
                { value: 'sur', label: 'Sur' },
              ]}
            />
          </Section>
        )}

        {settings && (
          <Section
            title="Open Plantbook (opcional)"
            description="Para buscar especies que no están en el catálogo. Es gratis: regístrate en open.plantbook.io, crea una API key y pégala aquí. Se guarda solo en este dispositivo."
          >
            <TextInput
              type="password"
              autoComplete="off"
              placeholder="API key de Open Plantbook"
              defaultValue={settings.plantbookApiKey ?? ''}
              onBlur={(e) => update('plantbookApiKey', e.target.value.trim() || undefined)}
            />
            <p className="text-xs text-muted">
              {getPlantbookKey(settings) ? '✓ Búsqueda en Open Plantbook activada.' : 'Sin key: solo se usa el catálogo incluido.'}
            </p>
          </Section>
        )}

        <Section title="Próximamente" description="Notificaciones de riego (fase 3) y copia de seguridad (fase 5).">
          {null}
        </Section>
      </div>
    </>
  )
}

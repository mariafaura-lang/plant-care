import { useCallback, useEffect, useState } from 'react'
import type { ThemePreference } from '../types'

const STORAGE_KEY = 'plant-care:theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'claro' || stored === 'oscuro' || stored === 'sistema') return stored
  } catch {
    // localStorage puede no estar disponible (modo privado): usamos el del sistema.
  }
  return 'sistema'
}

function applyTheme(pref: ThemePreference) {
  const dark = pref === 'oscuro' || (pref === 'sistema' && darkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Tema claro/oscuro/sistema. El script de index.html lo aplica antes de pintar. */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'sistema') return
    const query = darkQuery()
    const onChange = () => applyTheme('sistema')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((pref: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      // Sin persistencia: el cambio dura hasta cerrar la app.
    }
    setThemeState(pref)
  }, [])

  return { theme, setTheme }
}

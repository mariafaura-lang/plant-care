import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DiagnosePage } from './pages/DiagnosePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlantsPage } from './pages/PlantsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPage } from './pages/TodayPage'

// HashRouter (#/plantas) para que funcione igual en Netlify, Vercel y GitHub
// Pages sin configurar redirecciones en el servidor.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="plantas" element={<PlantsPage />} />
          <Route path="diagnostico" element={<DiagnosePage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

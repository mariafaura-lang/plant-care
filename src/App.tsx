import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CatalogPage } from './pages/CatalogPage'
import { DiagnosePage } from './pages/DiagnosePage'
import { DiagnosisDetailPage } from './pages/DiagnosisDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { PlantFormPage } from './pages/PlantFormPage'
import { PlantsPage } from './pages/PlantsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SpeciesDetailPage } from './pages/SpeciesDetailPage'
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
          <Route path="plantas/nueva" element={<PlantFormPage />} />
          <Route path="plantas/:id" element={<PlantDetailPage />} />
          <Route path="plantas/:id/editar" element={<PlantFormPage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="catalogo/:speciesId" element={<SpeciesDetailPage />} />
          <Route path="diagnostico" element={<DiagnosePage />} />
          <Route path="diagnostico/:id" element={<DiagnosisDetailPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlantsPage } from './pages/PlantsPage'
import { TodayPage } from './pages/TodayPage'

// Las demás pantallas se cargan aparte para que la app arranque antes, y se
// precargan en segundo plano nada más arrancar (además, el service worker las
// guarda todas para usarlas sin conexión).
const loaders = {
  CatalogPage: () => import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
  DiagnosePage: () => import('./pages/DiagnosePage').then((m) => ({ default: m.DiagnosePage })),
  DiagnosisDetailPage: () => import('./pages/DiagnosisDetailPage').then((m) => ({ default: m.DiagnosisDetailPage })),
  PlantDetailPage: () => import('./pages/PlantDetailPage').then((m) => ({ default: m.PlantDetailPage })),
  PlantFormPage: () => import('./pages/PlantFormPage').then((m) => ({ default: m.PlantFormPage })),
  SettingsPage: () => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
  SpeciesDetailPage: () => import('./pages/SpeciesDetailPage').then((m) => ({ default: m.SpeciesDetailPage })),
}
const CatalogPage = lazy(loaders.CatalogPage)
const DiagnosePage = lazy(loaders.DiagnosePage)
const DiagnosisDetailPage = lazy(loaders.DiagnosisDetailPage)
const PlantDetailPage = lazy(loaders.PlantDetailPage)
const PlantFormPage = lazy(loaders.PlantFormPage)
const SettingsPage = lazy(loaders.SettingsPage)
const SpeciesDetailPage = lazy(loaders.SpeciesDetailPage)

setTimeout(() => Object.values(loaders).forEach((load) => load().catch(() => {})), 1500)

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

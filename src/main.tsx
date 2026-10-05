import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { db } from './db/db'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Abrimos la base de datos antes de pintar: si falla (navegador sin IndexedDB,
// modo privado muy restrictivo, esquema corrupto…) mostramos un aviso claro en
// vez de una pantalla en blanco.
db.open()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    console.error('No se pudo abrir la base de datos', error)
    root.render(
      <div className="mx-auto max-w-sm space-y-3 p-6 text-center">
        <h1 className="text-xl font-bold">No se pudieron cargar tus datos</h1>
        <p className="text-sm text-muted">
          Tu navegador no permite guardar datos en este dispositivo (¿modo incógnito?). Prueba a abrir la app en una
          ventana normal o a recargar la página.
        </p>
        <button className="rounded-xl bg-accent px-4 py-2 font-medium text-on-accent" onClick={() => location.reload()}>
          Recargar
        </button>
      </div>,
    )
  })

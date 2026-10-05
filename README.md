# Mis Plantas 🌿

App web (PWA) para cuidar tus plantas de interior: recordatorios de riego,
catálogo de especies y diagnóstico de problemas. Pensada para el móvil, con
modo oscuro y **datos 100 % locales** (IndexedDB), sin cuentas ni servidor.

> En desarrollo por fases. Estado actual: **fase 1 — estructura y modelo de datos.**

## Arrancar en local

Necesitas [Node.js](https://nodejs.org/) 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests con Vitest
npm run build      # build de producción en dist/
```

## Stack

React 19 + Vite + TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) ·
React Router · Vitest · lucide-react (iconos).

## Estructura

```
src/
├── types/        modelo de datos (Plant, Species, WateringEvent, DiagnosisRecord, Settings)
├── db/           base de datos Dexie (esquema versionado)
├── data/         species.json y diagnosis-rules.json
├── lib/          lógica pura con tests (fechas, riego, diagnóstico, copia de seguridad…)
├── hooks/        hooks de React (tema, ajustes…)
├── components/   componentes de interfaz y layout
└── pages/        pantallas (Hoy, Plantas, Diagnóstico, Ajustes)
```

El despliegue gratuito (Netlify, Vercel o GitHub Pages) se documentará en la fase 5.

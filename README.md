# Mis Plantas 🌿

App web (PWA) para cuidar tus plantas de interior: recordatorios de riego,
catálogo de especies y diagnóstico de problemas. Pensada para el móvil, con
modo oscuro y **datos 100 % locales** (IndexedDB), sin cuentas ni servidor.

> En desarrollo por fases. Estado actual: **fase 2 — Mis plantas y catálogo.**

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

## Catálogo de especies

`src/data/species.json` incluye 54 plantas de interior comunes con luz, humedad,
temperatura, riego base (verano/invierno), dificultad, toxicidad para mascotas y
un consejo. Se ha redactado desde cero para esta app; la toxicidad sigue la
base de datos de plantas de la [ASPCA](https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants).
Como referencia se consultó [fronds](https://github.com/timoneiro/fronds)
(licencia MIT), sin copiar sus datos.

### Open Plantbook (opcional y gratuito)

Para buscar especies que no están en el catálogo, regístrate en
[open.plantbook.io](https://open.plantbook.io), crea una API key y pégala en
**Ajustes** (se guarda solo en tu dispositivo). También se puede poner en
`VITE_PLANTBOOK_API_KEY` (ver `.env.example`), pero ten en cuenta que entonces
queda dentro del código publicado. Plantbook no da riego ni toxicidad: el riego
se estima a partir de la humedad de suelo recomendada.

El despliegue gratuito (Netlify, Vercel o GitHub Pages) se documentará en la fase 5.

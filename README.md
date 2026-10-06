# Mis Plantas 🌿

App web (PWA) para cuidar tus plantas de interior: recordatorios de riego,
catálogo de especies y diagnóstico de problemas. Pensada para el móvil, con
modo oscuro y **datos 100 % locales** (IndexedDB), sin cuentas ni servidor.

> En desarrollo por fases. Estado actual: **fase 4 — diagnóstico.**

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

## Cómo se calcula el riego

Está en `src/lib/watering.ts` (con tests en `watering.test.ts`):

```
intervalo = base de la especie según la estación × maceta × tamaño × ajuste personal
  · estación: entre el intervalo de verano y el de invierno, con una curva suave
    (pleno invierno a mediados de enero y pleno verano a mediados de julio;
    al revés en el hemisferio sur, configurable en Ajustes)
  · maceta:   barro ×0,8 · plástico ×1,1 · cerámica esmaltada ×1
  · tamaño:   pequeña ×0,8 · mediana ×1 · grande ×1,25
  · especie desconocida: 7 días en verano y 14 en invierno
próximo riego = último riego + intervalo  (o la fecha de "Más tarde", si es posterior)
```

**Riego adaptativo:** con 3 o más riegos registrados, compara cada intervalo
real con el calculado en esa fecha. Con la mediana de las proporciones (así
unas vacaciones no lo descolocan), propone un ajuste personal si la diferencia
supera el 20 %. Se guarda como factor, no como días fijos, para que se siga
adaptando a la estación.

**Avisos:** como no hay servidor, el aviso salta al abrir la app (o mientras
está abierta) a partir de la hora elegida, una vez al día. En iPhone solo
funcionan con la app instalada en la pantalla de inicio (iOS 16.4+). Para
recordatorios sin abrir la app, en Ajustes se puede exportar un calendario
`.ics`.

## Diagnóstico

El asistente «¿Qué le pasa a mi planta?» pregunta por síntomas y contexto, y un
motor de reglas (`src/lib/diagnosis.ts`, con tests) devuelve las causas más
probables con su tratamiento paso a paso. Todos los datos están en
`src/data/diagnosis-rules.json`:

- `symptoms`: síntomas que se pueden marcar.
- `questions`: preguntas de contexto. Pueden depender de los síntomas
  (`showIfSymptoms` / `hideIfSymptoms`) o deducirse de la planta (`derived`:
  humedad y luz de la especie, riego atrasado).
- `causes`: causas con resumen, urgencia, tratamiento y prevención.
- `rules`: cada regla suma (o resta) `weight` a una causa si se marcó alguno de
  sus `symptoms` y TODAS sus `answers` coinciden. Una causa solo aparece si
  la apoya algún síntoma; la probabilidad es su parte del total.

Para añadir una causa o afinar las reglas basta con editar el JSON; el test
`diagnosis.test.ts` comprueba que todo está bien enlazado. Cada diagnóstico se
guarda en el historial de la planta.

**Diagnóstico por foto:** desactivado y oculto. Solo está preparado el punto de
integración en `src/lib/integrations/vision.ts` (interfaz, conversión de la
imagen e instrucciones para el modelo usando los ids de causa). La tarjeta
aparece únicamente si al compilar se definen `VITE_VISION_ENDPOINT` y
`VITE_VISION_API_KEY`.

El despliegue gratuito (Netlify, Vercel o GitHub Pages) se documentará en la fase 5.

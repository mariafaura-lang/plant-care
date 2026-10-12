# Mis Plantas 🌿

App web para cuidar tus plantas de interior: recordatorios de riego, catálogo de
especies y diagnóstico de problemas. Pensada para el móvil, con modo oscuro,
instalable como app (PWA) y usable sin conexión.

**Gratis y privada:** no hay cuentas ni servidor. Los datos se guardan solo en
tu dispositivo (IndexedDB). Para no perderlos o pasarlos a otro móvil, usa
**Ajustes → Copia de seguridad**.

## Qué hace

- **Hoy:** plantas que toca regar, atrasadas y próximos 7 días. Botones
  *Regada* (con deshacer), *Más tarde* (1-3 días) y *Regar todas*.
- **Mis plantas:** apodo, especie, habitación, foto, fecha de compra, maceta y
  notas. Agrupadas por habitación, con buscador.
- **Catálogo** de 54 especies con luz, humedad, temperatura, riego,
  dificultad, toxicidad para mascotas y un consejo. Opcional: búsqueda en
  Open Plantbook.
- **Riego inteligente:** se ajusta a la estación, la maceta y su tamaño, y
  aprende de tus riegos reales. Avisos del navegador y exportación a calendario
  (`.ics`).
- **Diagnóstico** paso a paso por síntomas, con causas probables y tratamiento.
  Se guarda en el historial de cada planta.
- **Copia de seguridad:** exportar e importar todo en un archivo JSON.

## Arrancar en local

Necesitas [Node.js](https://nodejs.org/) 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173 (sin service worker)
npm test           # tests con Vitest
npm run lint       # linter (oxlint)
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173 (con service worker y modo sin conexión)
```

Para probarla en el móvil, `npm run dev -- --host` y abre la dirección de red
que aparece (el móvil debe estar en la misma wifi). Los avisos y la
instalación necesitan HTTPS, así que esas dos cosas solo se pueden probar
una vez publicada.

## Publicarla gratis

La app es estática (solo archivos), así que cualquier hosting gratuito sirve.
Usa rutas con `#` (`/#/plantas`), por lo que no hace falta configurar
redirecciones.

### Opción 1: Netlify (recomendada)

1. Entra en [app.netlify.com](https://app.netlify.com) con tu cuenta de GitHub.
2. **Add new site → Import an existing project → GitHub** y elige `plant-care`.
3. Netlify lee `netlify.toml` (build `npm run build`, carpeta `dist`). Pulsa **Deploy**.
4. En un minuto tendrás una dirección tipo `https://nombre.netlify.app`. Cada
   cambio en `main` se publica solo.

### Opción 2: Vercel

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub.
2. **Add New → Project**, importa `plant-care` y pulsa **Deploy** (detecta Vite solo).

### Opción 3: GitHub Pages

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. **Actions → Publicar en GitHub Pages → Run workflow**.
3. Quedará en `https://<tu-usuario>.github.io/plant-care/`.

> Con un repositorio privado, GitHub Pages necesita un plan de pago; Netlify y
> Vercel funcionan gratis también con repositorios privados.

### Instalarla en el móvil

Abre la dirección publicada y:

- **Android (Chrome):** en la app, Ajustes → *Instalar Mis Plantas*, o menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** Compartir → *Añadir a pantalla de inicio*. Es necesario
  para recibir avisos (iOS 16.4 o posterior).

## Stack

React 19 + Vite + TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) ·
React Router · vite-plugin-pwa + Workbox · Vitest · lucide-react (iconos).

## Estructura

```
src/
├── types/        modelo de datos (Plant, Species, WateringEvent, DiagnosisRecord, Settings)
├── db/           base de datos Dexie (esquema versionado)
├── data/         species.json (catálogo) y diagnosis-rules.json (motor de diagnóstico)
├── lib/          lógica pura con tests
│   ├── watering.ts         cálculo del riego y riego adaptativo
│   ├── diagnosis.ts        motor de reglas del diagnóstico
│   ├── backup.ts           exportar / importar
│   ├── dailyReminder.ts    aviso diario (app y service worker)
│   ├── ics.ts              calendario .ics
│   └── integrations/       Open Plantbook y diagnóstico por foto (desactivado)
├── hooks/        hooks de React (plantas, riego, ajustes, tema…)
├── components/   componentes de interfaz
├── pages/        pantallas (Hoy, Plantas, Catálogo, Diagnóstico, Ajustes…)
└── sw.ts         service worker: caché sin conexión y aviso en segundo plano
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

## Sin conexión y avisos

- El service worker (`src/sw.ts`) guarda la app en caché: después de la primera
  visita funciona sin internet. Las actualizaciones se aplican solas.
- El aviso diario de riego salta al abrir la app (o mientras está abierta) a
  partir de la hora elegida. En Chrome para Android, con la app instalada, el
  service worker también lo intenta en segundo plano (Periodic Background
  Sync). Es el navegador quien decide cuándo despertarlo, así que puede llegar
  con retraso. En iPhone y otros navegadores no existe: allí el aviso solo
  salta al abrir la app. Para recordatorios fiables sin abrirla, exporta el
  calendario `.ics` desde Ajustes.

## Copia de seguridad

**Ajustes → Copia de seguridad → Exportar mis datos** descarga un archivo
`mis-plantas-AAAA-MM-DD.json` con plantas (fotos incluidas), riegos,
diagnósticos, especies propias y ajustes. No incluye tu API key de Open Plantbook.

Al importarlo puedes **combinar** (añade lo que falte; si una planta está en los
dos sitios gana la edición más reciente, y repetir la importación no duplica
nada) o **reemplazar** todo.

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base` permite publicar en una subcarpeta (GitHub Pages: BASE_PATH=/plant-care/).
// Las rutas del manifest son relativas, así que funcionan con cualquier base.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Service worker propio (src/sw.ts): caché sin conexión + aviso de riego en segundo plano.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // Lo registramos a mano en main.tsx para buscar actualizaciones periódicamente.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      manifest: {
        name: 'Mis Plantas',
        short_name: 'Mis Plantas',
        description: 'Cuida tus plantas de interior: recordatorios de riego, catálogo de especies y diagnóstico de problemas.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#2f7d4f',
        background_color: '#f6f8f4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['lifestyle', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Regar hoy', url: './#/', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Añadir planta', url: './#/plantas/nueva', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: '¿Qué le pasa?', url: './#/diagnostico', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
    }),
  ],
})

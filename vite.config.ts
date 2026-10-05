import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// La configuración de la PWA (manifest + service worker) se añade en la fase 5.
// `base` permite desplegar en una subcarpeta (p. ej. GitHub Pages: /plant-care/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})

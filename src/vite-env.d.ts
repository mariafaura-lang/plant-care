/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PLANTBOOK_API_KEY?: string
  readonly VITE_VISION_API_KEY?: string
  readonly VITE_VISION_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

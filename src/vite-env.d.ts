/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLANTBOOK_API_KEY?: string
  readonly VITE_VISION_API_KEY?: string
  readonly VITE_VISION_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

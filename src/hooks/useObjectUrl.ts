// Una URL por Blob, reutilizada entre renders y componentes. No se revocan:
// son pocas fotos pequeñas (≈100 KB) y así evitamos parpadeos al navegar.
const cache = new WeakMap<Blob, string>()

/** URL temporal para mostrar un Blob (foto) en un <img>. */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  if (!blob) return undefined
  let url = cache.get(blob)
  if (!url) {
    url = URL.createObjectURL(blob)
    cache.set(blob, url)
  }
  return url
}

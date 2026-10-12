/**
 * Reduce una foto del móvil (que puede pesar varios MB) a JPEG de como mucho
 * `maxSize` píxeles de lado, para que la base de datos y las copias de
 * seguridad no crezcan sin control.
 */
export async function resizeImage(file: Blob, maxSize = 1024, quality = 0.8): Promise<Blob> {
  try {
    // imageOrientation respeta la rotación EXIF de las fotos del móvil.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    return blob ?? file
  } catch {
    // Formato que el navegador no sabe decodificar (p. ej. HEIC en algunos Android): guardamos el original.
    return file
  }
}

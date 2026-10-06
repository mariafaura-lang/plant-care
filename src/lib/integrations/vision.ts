import type { DiagnosisResult } from '../../types'
import type { Cause } from '../diagnosis'

/**
 * PUNTO DE INTEGRACIÓN (sin implementar) para el diagnóstico por foto con un
 * modelo de visión. Está DESACTIVADO: solo se activa si al compilar se definen
 * VITE_VISION_ENDPOINT y VITE_VISION_API_KEY (ver .env.example).
 *
 * Para implementarlo:
 *  1. Convertir la foto con `imageToBase64()`.
 *  2. Enviar al modelo la imagen y el texto de `buildVisionPrompt()`, que pide
 *     elegir entre los ids de causa del motor de reglas, y respuesta en JSON.
 *  3. Convertir la respuesta en `VisionDiagnosisResponse`: los resultados
 *     tienen el mismo formato que los del motor de reglas, así que se pueden
 *     mostrar y guardar en el historial igual.
 *  OJO: sin servidor, la API key quedaría expuesta en el navegador. Para un
 *  uso real, poner delante una función serverless (Netlify/Vercel) que guarde
 *  la key.
 */

export interface VisionDiagnosisRequest {
  image: Blob
  plantName?: string
  speciesName?: string
  /** Síntomas ya marcados en el asistente, como pista para el modelo. */
  symptoms?: string[]
}

export interface VisionDiagnosisResponse {
  results: DiagnosisResult[]
  /** Explicación libre del modelo, para mostrar al usuario. */
  explanation?: string
}

export class VisionNotAvailableError extends Error {
  constructor() {
    super('El diagnóstico por foto todavía no está disponible.')
  }
}

export function getVisionConfig(): { endpoint: string; apiKey: string } | null {
  const endpoint = import.meta.env.VITE_VISION_ENDPOINT?.trim()
  const apiKey = import.meta.env.VITE_VISION_API_KEY?.trim()
  return endpoint && apiKey ? { endpoint, apiKey } : null
}

export const isVisionEnabled = () => getVisionConfig() !== null

/** Foto → base64 (sin el prefijo data:), el formato que suelen pedir las APIs de visión. */
export async function imageToBase64(image: Blob): Promise<string> {
  const bytes = new Uint8Array(await image.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

/** Instrucciones para el modelo: elegir causas del catálogo para poder reutilizar los tratamientos. */
export function buildVisionPrompt(request: Omit<VisionDiagnosisRequest, 'image'>, causes: Cause[]): string {
  return [
    'Eres un experto en plantas de interior. Analiza la foto y di qué le pasa a la planta.',
    request.speciesName && `Especie: ${request.speciesName}.`,
    request.symptoms?.length && `Síntomas que indica el usuario: ${request.symptoms.join(', ')}.`,
    'Elige como mucho 3 causas de esta lista (usa el id exacto):',
    ...causes.map((c) => `- ${c.id}: ${c.name}`),
    'Responde solo con JSON: {"results":[{"causeId":"…","probability":0.0}],"explanation":"…"}',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function diagnoseFromPhoto(request: VisionDiagnosisRequest): Promise<VisionDiagnosisResponse> {
  if (!isVisionEnabled()) throw new VisionNotAvailableError()
  // TODO: llamar al endpoint configurado (ver comentario de arriba).
  void request
  throw new VisionNotAvailableError()
}

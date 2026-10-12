import { describe, expect, it } from 'vitest'
import { RULES } from '../diagnosis'
import { buildVisionPrompt, diagnoseFromPhoto, imageToBase64, isVisionEnabled, VisionNotAvailableError } from './vision'

describe('diagnóstico por foto (punto de integración)', () => {
  it('está desactivado si no hay configuración', async () => {
    expect(isVisionEnabled()).toBe(false)
    await expect(diagnoseFromPhoto({ image: new Blob(['x']) })).rejects.toBeInstanceOf(VisionNotAvailableError)
  })

  it('prepara la imagen y unas instrucciones que usan los ids del motor de reglas', async () => {
    expect(await imageToBase64(new Blob(['hola']))).toBe(btoa('hola'))
    const prompt = buildVisionPrompt({ speciesName: 'Monstera', symptoms: ['Hojas amarillas'] }, RULES.causes)
    expect(prompt).toContain('Especie: Monstera.')
    expect(prompt).toContain('- exceso-riego: Exceso de riego')
    expect(prompt).toContain('"causeId"')
  })
})

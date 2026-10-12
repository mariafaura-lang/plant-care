import { describe, expect, it } from 'vitest'
import { contextAnswers, diagnose, likelihood, RULES, validateRules, visibleQuestions, type DiagnosisInput } from './diagnosis'

const top = (input: DiagnosisInput) => diagnose(input)[0]?.causeId
const ids = (input: DiagnosisInput) => diagnose(input).map((r) => r.causeId)

describe('diagnosis-rules.json', () => {
  it('es coherente: ids, referencias, tratamientos y causas alcanzables', () => {
    expect(validateRules(RULES)).toEqual([])
  })

  it('incluye las causas pedidas', () => {
    const causes = RULES.causes.map((c) => c.id)
    for (const id of ['exceso-riego', 'falta-riego', 'poca-luz', 'sol-directo', 'humedad-baja', 'cochinilla', 'arana-roja', 'trips', 'hongos', 'falta-nutrientes', 'raices-apretadas']) {
      expect(causes).toContain(id)
    }
  })

  it('detecta errores en unas reglas mal escritas', () => {
    const broken = {
      ...RULES,
      rules: [...RULES.rules, { cause: 'no-existe', weight: 1, symptoms: ['tampoco'] }, { cause: 'hongos', weight: 1, answers: { tierra: ['mojadita'] } }],
    }
    const errors = validateRules(broken)
    expect(errors.some((e) => e.includes('causa desconocida'))).toBe(true)
    expect(errors.some((e) => e.includes('síntoma desconocido tampoco'))).toBe(true)
    expect(errors.some((e) => e.includes('opción desconocida tierra=mojadita'))).toBe(true)
  })
})

describe('preguntas', () => {
  it('solo hace las preguntas condicionales si toca, y primero', () => {
    const basic = visibleQuestions(['puntas-marrones']).map((q) => q.id)
    expect(basic).not.toContain('que-hojas')
    expect(basic).not.toContain('tipo-bichos')
    expect(basic).toContain('tierra')
    expect(basic).toContain('insectos')

    const withYellow = visibleQuestions(['hojas-amarillas', 'bichos']).map((q) => q.id)
    expect(withYellow.slice(0, 2).sort()).toEqual(['que-hojas', 'tipo-bichos'])
    // Si ya marcó "bichos", no se pregunta si ve insectos.
    expect(withYellow).not.toContain('insectos')
  })

  it('nunca pregunta los datos que se deducen de la planta', () => {
    const all = visibleQuestions(RULES.symptoms.map((s) => s.id)).map((q) => q.id)
    expect(all).not.toContain('especie-humedad')
    expect(all).not.toContain('estado-riego')
  })

  it('deduce el contexto de la especie y del riego', () => {
    expect(contextAnswers({ humidity: 'alta', light: 'media' }, { status: 'atrasada' })).toEqual({
      'especie-humedad': 'alta',
      'especie-luz': 'media',
      'estado-riego': 'atrasada',
    })
    expect(contextAnswers(undefined, { status: 'hoy' })).toEqual({ 'estado-riego': 'al-dia' })
  })
})

describe('motor de diagnóstico', () => {
  it('sin síntomas no devuelve nada', () => {
    expect(diagnose({ symptoms: [], answers: { tierra: 'empapada' } })).toEqual([])
  })

  it('devuelve probabilidades ordenadas que suman 1, como mucho 5 causas', () => {
    const results = diagnose({ symptoms: RULES.symptoms.map((s) => s.id), answers: {} })
    expect(results.length).toBeLessThanOrEqual(5)
    expect(results.reduce((sum, r) => sum + r.probability, 0)).toBeCloseTo(1)
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
  })

  it('hojas amarillas con la tierra empapada y agua en el plato → exceso de riego', () => {
    const input = { symptoms: ['hojas-amarillas'], answers: { tierra: 'empapada', plato: 'si', 'que-hojas': 'todas' } }
    expect(top(input)).toBe('exceso-riego')
    expect(likelihood(diagnose(input)[0].probability)).toBe('muy-probable')
  })

  it('hojas mustias con la tierra muy seca y el riego atrasado → falta de riego', () => {
    expect(top({ symptoms: ['hojas-caidas', 'hojas-amarillas'], answers: { tierra: 'muy-seca', 'estado-riego': 'atrasada' } })).toBe('falta-riego')
  })

  it('la tierra seca descarta el exceso de riego', () => {
    expect(ids({ symptoms: ['hojas-amarillas'], answers: { tierra: 'seca', 'que-hojas': 'viejas' } })).not.toContain('exceso-riego')
  })

  it('puntas marrones en una calathea junto al radiador → ambiente seco', () => {
    expect(top({ symptoms: ['puntas-marrones'], answers: { ambiente: 'calefaccion', 'especie-humedad': 'alta', tierra: 'humeda' } })).toBe('humedad-baja')
  })

  it('puntas marrones en un cactus no apuntan a humedad baja', () => {
    expect(top({ symptoms: ['puntas-marrones'], answers: { 'especie-humedad': 'baja', abono: 'mucho' } })).toBe('cal-sales')
  })

  it('bolitas de algodón → cochinilla', () => {
    expect(top({ symptoms: ['bichos', 'hojas-pegajosas'], answers: { 'tipo-bichos': 'algodon' } })).toBe('cochinilla')
  })

  it('telarañas finas y punteado → araña roja', () => {
    expect(top({ symptoms: ['telaranas', 'manchas'], answers: { 'tipo-manchas': 'punteado', ambiente: 'calefaccion' } })).toBe('arana-roja')
  })

  it('zonas plateadas con puntitos negros → trips', () => {
    expect(top({ symptoms: ['manchas'], answers: { 'tipo-manchas': 'plateadas' } })).toBe('trips')
  })

  it('tallos estirados con poca luz → poca luz', () => {
    expect(top({ symptoms: ['crecimiento-estirado', 'hojas-palidas'], answers: { luz: 'poca' } })).toBe('poca-luz')
  })

  it('manchas secas y claras al sol → quemaduras por sol', () => {
    expect(top({ symptoms: ['manchas'], answers: { 'tipo-manchas': 'secas-claras', luz: 'sol-directo' } })).toBe('sol-directo')
  })

  it('manchas oscuras con halo y tierra húmeda → hongos', () => {
    expect(top({ symptoms: ['manchas'], answers: { 'tipo-manchas': 'oscuras-halo', tierra: 'humeda' } })).toBe('hongos')
  })

  it('polvillo blanco → hongos (oídio)', () => {
    expect(top({ symptoms: ['manchas'], answers: { 'tipo-manchas': 'polvo-blanco' } })).toBe('hongos')
  })

  it('no crece, raíces por fuera y años sin trasplantar → raíces apretadas', () => {
    expect(top({ symptoms: ['crecimiento-lento', 'raices-fuera'], answers: { trasplante: 'mas-2', luz: 'mucha-indirecta' } })).toBe('raices-apretadas')
  })

  it('hojas viejas amarillas sin abonar en meses → falta de nutrientes', () => {
    expect(top({ symptoms: ['hojas-amarillas', 'hojas-palidas'], answers: { 'que-hojas': 'viejas', abono: 'nunca', tierra: 'seca', luz: 'mucha-indirecta' } })).toBe(
      'falta-nutrientes',
    )
  })

  it('pierde hojas tras cambiarla de sitio → estrés por cambio', () => {
    expect(top({ symptoms: ['caida-hojas'], answers: { cambio: 'si', tierra: 'humeda', luz: 'mucha-indirecta' } })).toBe('estres-cambio')
  })

  it('tallo podrido → raíces podridas, aunque haya otros síntomas', () => {
    expect(top({ symptoms: ['tallo-podrido', 'hojas-amarillas', 'hojas-blandas'], answers: { tierra: 'empapada' } })).toBe('pudricion-raices')
  })

  it('mosquitas sobre la tierra → mosquitas del sustrato', () => {
    expect(top({ symptoms: ['bichos'], answers: { 'tipo-bichos': 'mosquitas', tierra: 'empapada' } })).toBe('mosca-sustrato')
  })

  it('las respuestas por sí solas no inventan causas sin síntomas que las apoyen', () => {
    // "Abono: nunca" apoya la falta de nutrientes, pero no con un síntoma que no tiene nada que ver.
    expect(ids({ symptoms: ['telaranas'], answers: { abono: 'nunca', plato: 'si' } })).toEqual(['arana-roja'])
  })

  it('"No lo sé" (sin respuesta) no rompe nada y da un diagnóstico más abierto', () => {
    const results = diagnose({ symptoms: ['hojas-amarillas'], answers: {} })
    expect(results.length).toBeGreaterThan(0)
  })
})

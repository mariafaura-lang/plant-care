import { Stethoscope } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/ui'

export function DiagnosePage() {
  return (
    <>
      <PageHeader title="¿Qué le pasa a mi planta?" />
      <EmptyState icon={<Stethoscope className="size-8" />} title="Asistente de diagnóstico">
        Responde unas preguntas sobre los síntomas y te diremos las causas más probables y cómo tratarlas. (Fase 4)
      </EmptyState>
    </>
  )
}

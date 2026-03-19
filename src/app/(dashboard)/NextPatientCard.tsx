'use client'

import Link from 'next/link'
import { Stethoscope, ShieldAlert, Clock, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateAge } from '@/lib/utils'

interface Diagnosis {
  description: string
  status: string
  code: string
}

interface NextApt {
  id: string
  dateTime: string
  reason: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    birthDate: string
    allergies: { allergen: string }[]
    clinicalRecords: { date: string; diagnoses: Diagnosis[] }[]
    _count: { clinicalRecords: number }
  }
}

function timeUntil(dateTime: string): string {
  const diff = new Date(dateTime).getTime() - Date.now()
  if (diff < 0) return 'Ahora'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `en ${mins} min`
  const hrs = Math.floor(mins / 60)
  return `en ${hrs}h ${mins % 60}min`
}

export function NextPatientCard({ apt }: { apt: NextApt }) {
  const p = apt.patient
  const age = calculateAge(new Date(p.birthDate))
  const apptTime = new Date(apt.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const lastRecord = p.clinicalRecords[0] ?? null
  const diagnoses = lastRecord?.diagnoses ?? []
  const severeAllergies = p.allergies
  const consultaHref = `/pacientes/${p.id}/historia/nueva-consulta?citaId=${apt.id}`
  const until = timeUntil(apt.dateTime)
  const isNow = until === 'Ahora'

  return (
    <section className={`panel overflow-hidden ${isNow ? 'border-primary/30' : ''}`}>
      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${isNow ? 'border-primary/20 bg-primary/5' : 'border-border bg-surface-alt'}`}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isNow ? 'animate-pulse bg-primary' : 'bg-foreground-subtle'}`} />
          <span className="section-kicker">
            {isNow ? 'Paciente actual' : 'Próximo paciente'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-foreground-subtle" />
          <span className="text-xs font-mono font-semibold text-foreground">{apptTime}</span>
          <span className={`text-xs font-medium ${isNow ? 'text-primary' : 'text-foreground-muted'}`}>
            — {until}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/pacientes/${p.id}`} className="text-lg font-bold text-foreground hover:text-primary transition-colors leading-tight">
                {p.firstName} {p.lastName}
              </Link>
              {severeAllergies.length > 0 && (
                <span title={`Alergia: ${severeAllergies.map(a => a.allergen).join(', ')}`}>
                  <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">{age} años</p>

            {apt.reason && (
              <p className="mt-2 text-sm text-foreground">
                <span className="font-medium">Motivo: </span>{apt.reason}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {diagnoses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {diagnoses.slice(0, 3).map((d, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        d.status === 'CHRONIC'
                          ? 'border-warning/30 bg-warning/5 text-warning'
                          : 'border-border bg-surface-alt text-foreground-muted'
                      }`}
                    >
                      {d.code} {d.description.length > 28 ? d.description.slice(0, 28) + '…' : d.description}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-foreground-subtle">
                <FileText className="h-3 w-3" />
                {p._count.clinicalRecords === 0
                  ? 'Primera consulta'
                  : `${p._count.clinicalRecords} consulta${p._count.clinicalRecords !== 1 ? 's' : ''}`}
              </div>
            </div>

            {severeAllergies.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-[var(--radius)] border border-danger/20 bg-danger/5 px-2.5 py-1.5 text-xs text-danger">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Alergia severa:</span>
                {severeAllergies.map(a => a.allergen).join(', ')}
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Button size="sm" asChild className="gap-1.5 font-semibold">
              <Link href={consultaHref}>
                <Stethoscope className="h-4 w-4" />
                Atender
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

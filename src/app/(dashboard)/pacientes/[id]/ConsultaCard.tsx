'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Heart, Activity, Thermometer, Wind, Pill, Pencil, Droplets, Waves, Stethoscope, ClipboardList, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PrescriptionSection } from './historia/PrescriptionSection'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function diagnosisStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default'
  if (status === 'CHRONIC') return 'secondary'
  return 'outline'
}

function diagnosisStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Activo',
    RESOLVED: 'Resuelto',
    CHRONIC: 'Crónico',
  }
  return map[status] ?? status
}

function formatDateTime(date: string) {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: es })
}

export interface ConsultaRecord {
  id: string
  date: string
  reason: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  notes: string | null
  doctor: { id: string; name: string; speciality: string | null }
  vitalSigns: {
    bloodPressureSys: number | null
    bloodPressureDia: number | null
    heartRate: number | null
    temperature: number | null
    oxygenSat: number | null
    weight: number | null
    height: number | null
    bmi: number | null
    glucoseLevel: number | null
    respiratoryRate: number | null
  } | null
  diagnoses: {
    id: string
    code: string
    description: string
    type: string
    status: string
    notes: string | null
  }[]
  prescriptions: {
    id: string
    notes: string | null
    createdAt: string
    doctor: { id: string; name: string; speciality: string | null }
    items: {
      id: string
      medication: string
      dosage: string
      frequency: string
      duration: string
      quantity: string | null
      instructions: string | null
    }[]
  }[]
}

function classifyBP(sys: number, dia: number) {
  if (sys < 120 && dia < 80) return { label: 'Normal', cls: 'text-success' }
  if (sys < 130 && dia < 80) return { label: 'Elevada', cls: 'text-warning' }
  if (sys < 140 || dia < 90) return { label: 'HTA I', cls: 'text-warning' }
  return { label: 'HTA II', cls: 'text-danger' }
}

function classifyHR(hr: number) {
  if (hr < 60) return { label: 'Bradicardia', cls: 'text-warning' }
  if (hr <= 100) return { label: 'Normal', cls: 'text-success' }
  return { label: 'Taquicardia', cls: 'text-danger' }
}

function classifyTemp(t: number) {
  if (t < 36.0) return { label: 'Hipotermia', cls: 'text-primary' }
  if (t <= 37.5) return { label: 'Normal', cls: 'text-success' }
  if (t <= 38.5) return { label: 'Febrícula', cls: 'text-warning' }
  return { label: 'Fiebre', cls: 'text-danger' }
}

function classifySpO2(sat: number) {
  if (sat >= 95) return { label: 'Normal', cls: 'text-success' }
  if (sat >= 90) return { label: 'Hipoxia leve', cls: 'text-warning' }
  return { label: 'Hipoxemia', cls: 'text-danger' }
}

function classifyBMI(bmi: number) {
  if (bmi < 18.5) return { label: 'Bajo peso', cls: 'text-primary' }
  if (bmi < 25) return { label: 'Normal', cls: 'text-success' }
  if (bmi < 30) return { label: 'Sobrepeso', cls: 'text-warning' }
  if (bmi < 35) return { label: 'Obesidad I', cls: 'text-warning' }
  return { label: 'Obesidad II', cls: 'text-danger' }
}

export function ConsultaCard({ record, patientId, defaultOpen = false }: { record: ConsultaRecord; patientId: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="shadow-sm overflow-hidden">
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3 hover:bg-background transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-1.5 text-foreground-subtle">{formatDateTime(record.date)}</p>
              <CardTitle className="text-base font-semibold leading-snug text-foreground">{record.reason}</CardTitle>
              <p className="text-xs mt-1 flex items-center gap-1 text-foreground-muted">
                <Stethoscope className="h-3 w-3 shrink-0" />
                {record.doctor.name}
                {record.doctor.speciality && <span className="opacity-60">· {record.doctor.speciality}</span>}
              </p>
              {/* Summary pills when collapsed */}
              {!open && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {record.diagnoses.slice(0, 3).map(dx => (
                    <span key={dx.id} className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-background px-2 py-0.5 text-xs text-foreground-muted">
                      <span className="font-mono font-semibold text-foreground-muted">{dx.code}</span>
                      <span className="truncate max-w-[120px]">{dx.description}</span>
                    </span>
                  ))}
                  {record.diagnoses.length > 3 && (
                    <span className="text-xs text-foreground-subtle">+{record.diagnoses.length - 3} más</span>
                  )}
                  {record.prescriptions.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-border-subtle border border-border px-2 py-0.5 text-xs font-medium text-foreground-muted">
                      <Pill className="h-3 w-3" />
                      {record.prescriptions.reduce((acc, p) => acc + p.items.length, 0)} medicamento(s)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Button variant="outline" size="sm" asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Link href={`/pacientes/${patientId}/historia/${record.id}/editar`}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Link>
              </Button>
              {open ? (
                <ChevronUp className="h-4 w-4 text-foreground-subtle" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground-subtle" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {/* Expandable body */}
      {open && (
        <CardContent className="space-y-5 border-t border-border pt-5">
          {/* Vital Signs */}
          {record.vitalSigns && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Signos Vitales</h4>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {record.vitalSigns.bloodPressureSys && record.vitalSigns.bloodPressureDia && (() => {
                  const c = classifyBP(record.vitalSigns!.bloodPressureSys!, record.vitalSigns!.bloodPressureDia!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                      <Heart className="h-4 w-4 text-foreground-muted shrink-0" />
                      <div>
                        <p className="text-xs text-foreground-subtle">PA</p>
                        <p className="text-sm font-medium text-foreground">{record.vitalSigns.bloodPressureSys}/{record.vitalSigns.bloodPressureDia}</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.heartRate && (() => {
                  const c = classifyHR(record.vitalSigns!.heartRate!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                      <Activity className="h-4 w-4 text-foreground-muted shrink-0" />
                      <div>
                        <p className="text-xs text-foreground-subtle">FC</p>
                        <p className="text-sm font-medium text-foreground">{record.vitalSigns.heartRate} lpm</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.temperature && (() => {
                  const c = classifyTemp(record.vitalSigns!.temperature!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                      <Thermometer className="h-4 w-4 text-foreground-muted shrink-0" />
                      <div>
                        <p className="text-xs text-foreground-subtle">Temp</p>
                        <p className="text-sm font-medium text-foreground">{record.vitalSigns.temperature}°C</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.oxygenSat && (() => {
                  const c = classifySpO2(record.vitalSigns!.oxygenSat!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                      <Wind className="h-4 w-4 text-foreground-muted shrink-0" />
                      <div>
                        <p className="text-xs text-foreground-subtle">SpO2</p>
                        <p className="text-sm font-medium text-foreground">{record.vitalSigns.oxygenSat}%</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.glucoseLevel && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                    <Droplets className="h-4 w-4 text-foreground-muted shrink-0" />
                    <div>
                      <p className="text-xs text-foreground-subtle">Glucosa</p>
                      <p className="text-sm font-medium text-foreground">{record.vitalSigns.glucoseLevel} mg/dL</p>
                    </div>
                  </div>
                )}
                {record.vitalSigns.respiratoryRate && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-3 py-2">
                    <Waves className="h-4 w-4 text-foreground-muted shrink-0" />
                    <div>
                      <p className="text-xs text-foreground-subtle">FR</p>
                      <p className="text-sm font-medium text-foreground">{record.vitalSigns.respiratoryRate} rpm</p>
                    </div>
                  </div>
                )}
              </div>
              {(record.vitalSigns.weight || record.vitalSigns.height || record.vitalSigns.bmi) && (
                <div className="mt-2 flex items-center gap-4 text-xs text-foreground-subtle">
                  {record.vitalSigns.weight && <span>Peso: {record.vitalSigns.weight} kg</span>}
                  {record.vitalSigns.height && <span>Talla: {record.vitalSigns.height} cm</span>}
                  {record.vitalSigns.bmi && (() => {
                    const c = classifyBMI(record.vitalSigns!.bmi!)
                    return <span>IMC: {record.vitalSigns!.bmi!.toFixed(1)} — <span className={`font-medium ${c.cls}`}>{c.label}</span></span>
                  })()}
                </div>
              )}
            </div>
          )}

          {/* SOAP */}
          {(record.subjective || record.objective || record.assessment || record.plan) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notas Clínicas</h4>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {record.subjective && (
                  <div className="rounded-lg border-l-2 border-border pl-3 py-2.5 bg-background">
                    <h4 className="text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">S · Subjetivo</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{record.subjective}</p>
                  </div>
                )}
                {record.objective && (
                  <div className="rounded-lg border-l-2 border-border pl-3 py-2.5 bg-background">
                    <h4 className="text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">O · Objetivo</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{record.objective}</p>
                  </div>
                )}
                {record.assessment && (
                  <div className="rounded-lg border-l-2 border-border pl-3 py-2.5 bg-background">
                    <h4 className="text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">A · Evaluación</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{record.assessment}</p>
                  </div>
                )}
                {record.plan && (
                  <div className="rounded-lg border-l-2 border-border pl-3 py-2.5 bg-background">
                    <h4 className="text-xs font-bold text-foreground-muted mb-1.5 uppercase tracking-wide">P · Plan</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{record.plan}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnoses */}
          {record.diagnoses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Diagnósticos CIE-10</h4>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-1.5">
                {record.diagnoses.map(dx => (
                  <div key={dx.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-background">
                    <span className="rounded font-mono text-xs font-bold text-foreground-muted bg-border-subtle border border-border px-1.5 py-0.5 shrink-0">{dx.code}</span>
                    <span className="text-sm flex-1 truncate text-foreground">{dx.description}</span>
                    <Badge variant={diagnosisStatusVariant(dx.status)} className="text-xs shrink-0">
                      {diagnosisStatusLabel(dx.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.notes && (
            <div className="rounded-lg border border-border bg-background p-3">
              <h4 className="text-xs font-semibold text-foreground-muted mb-1">Notas</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}

          {/* Prescriptions */}
          <div className="border-t border-border-subtle pt-4">
            <PrescriptionSection
              consultationId={record.id}
              prescriptions={record.prescriptions}
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

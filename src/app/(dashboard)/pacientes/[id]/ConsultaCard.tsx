'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Heart, Activity, Thermometer, Wind, Pill } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrescriptionSection } from './historia/PrescriptionSection'

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
  return new Date(date).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  if (sys < 120 && dia < 80) return { label: 'Normal', cls: 'text-green-600' }
  if (sys < 130 && dia < 80) return { label: 'Elevada', cls: 'text-yellow-600' }
  if (sys < 140 || dia < 90) return { label: 'HTA I', cls: 'text-orange-600' }
  return { label: 'HTA II', cls: 'text-red-600' }
}

function classifyHR(hr: number) {
  if (hr < 60) return { label: 'Bradicardia', cls: 'text-yellow-600' }
  if (hr <= 100) return { label: 'Normal', cls: 'text-green-600' }
  return { label: 'Taquicardia', cls: 'text-red-600' }
}

function classifyTemp(t: number) {
  if (t < 36.0) return { label: 'Hipotermia', cls: 'text-blue-600' }
  if (t <= 37.5) return { label: 'Normal', cls: 'text-green-600' }
  if (t <= 38.5) return { label: 'Febrícula', cls: 'text-yellow-600' }
  return { label: 'Fiebre', cls: 'text-red-600' }
}

function classifySpO2(sat: number) {
  if (sat >= 95) return { label: 'Normal', cls: 'text-green-600' }
  if (sat >= 90) return { label: 'Hipoxia leve', cls: 'text-yellow-600' }
  return { label: 'Hipoxemia', cls: 'text-red-600' }
}

function classifyBMI(bmi: number) {
  if (bmi < 18.5) return { label: 'Bajo peso', cls: 'text-blue-600' }
  if (bmi < 25) return { label: 'Normal', cls: 'text-green-600' }
  if (bmi < 30) return { label: 'Sobrepeso', cls: 'text-yellow-600' }
  if (bmi < 35) return { label: 'Obesidad I', cls: 'text-orange-600' }
  return { label: 'Obesidad II', cls: 'text-red-600' }
}

export function ConsultaCard({ record, defaultOpen = false }: { record: ConsultaRecord; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="shadow-sm overflow-hidden">
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-1">{formatDateTime(record.date)}</p>
              <CardTitle className="text-base text-slate-900">{record.reason}</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Dr. {record.doctor.name}
                {record.doctor.speciality && ` — ${record.doctor.speciality}`}
              </p>
              {/* Summary pills when collapsed */}
              {!open && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {record.diagnoses.slice(0, 3).map(dx => (
                    <span key={dx.id} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      <span className="font-mono mr-1">{dx.code}</span>{dx.description}
                    </span>
                  ))}
                  {record.diagnoses.length > 3 && (
                    <span className="text-xs text-slate-400">+{record.diagnoses.length - 3} más</span>
                  )}
                  {record.prescriptions.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                      <Pill className="h-3 w-3" />
                      {record.prescriptions.length} receta(s)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {open ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {/* Expandable body */}
      {open && (
        <CardContent className="space-y-4 border-t border-slate-100 pt-4">
          {/* Vital Signs */}
          {record.vitalSigns && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Signos Vitales</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {record.vitalSigns.bloodPressureSys && record.vitalSigns.bloodPressureDia && (() => {
                  const c = classifyBP(record.vitalSigns!.bloodPressureSys!, record.vitalSigns!.bloodPressureDia!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                      <Heart className="h-4 w-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">PA</p>
                        <p className="text-sm font-medium text-slate-900">{record.vitalSigns.bloodPressureSys}/{record.vitalSigns.bloodPressureDia}</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.heartRate && (() => {
                  const c = classifyHR(record.vitalSigns!.heartRate!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2">
                      <Activity className="h-4 w-4 text-pink-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">FC</p>
                        <p className="text-sm font-medium text-slate-900">{record.vitalSigns.heartRate} lpm</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.temperature && (() => {
                  const c = classifyTemp(record.vitalSigns!.temperature!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2">
                      <Thermometer className="h-4 w-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Temp</p>
                        <p className="text-sm font-medium text-slate-900">{record.vitalSigns.temperature}°C</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
                {record.vitalSigns.oxygenSat && (() => {
                  const c = classifySpO2(record.vitalSigns!.oxygenSat!)
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2">
                      <Wind className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">SpO2</p>
                        <p className="text-sm font-medium text-slate-900">{record.vitalSigns.oxygenSat}%</p>
                        <p className={`text-xs font-medium ${c.cls}`}>{c.label}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
              {(record.vitalSigns.weight || record.vitalSigns.height || record.vitalSigns.bmi) && (
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {record.subjective && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <h4 className="text-xs font-semibold text-slate-600 mb-1">S — Subjetivo</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.subjective}</p>
                </div>
              )}
              {record.objective && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <h4 className="text-xs font-semibold text-slate-600 mb-1">O — Objetivo</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.objective}</p>
                </div>
              )}
              {record.assessment && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <h4 className="text-xs font-semibold text-slate-600 mb-1">A — Evaluación</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.assessment}</p>
                </div>
              )}
              {record.plan && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <h4 className="text-xs font-semibold text-slate-600 mb-1">P — Plan</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.plan}</p>
                </div>
              )}
            </div>
          )}

          {/* Diagnoses */}
          {record.diagnoses.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Diagnósticos CIE-10</h4>
              <div className="space-y-1.5">
                {record.diagnoses.map(dx => (
                  <div key={dx.id} className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{dx.code}</span>
                    <span className="text-sm text-slate-700 flex-1">{dx.description}</span>
                    <Badge variant={diagnosisStatusVariant(dx.status)} className="text-xs">
                      {diagnosisStatusLabel(dx.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <h4 className="text-xs font-semibold text-amber-700 mb-1">Notas</h4>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}

          {/* Prescriptions */}
          <div className="border-t border-slate-100 pt-4">
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Share2, ArrowRight, Clock, Loader2, CheckCircle2, XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Referral {
  id: string
  toSpecialty: string
  urgency: string
  status: string
  reason: string
  createdAt: string
  fromDoctor: { name: string }
  toDoctor: { name: string } | null
  consultation: { reason: string } | null
}

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  PSYCHOLOGY: 'Psicología',
  PSYCHIATRY: 'Psiquiatría',
  NUTRITION: 'Nutrición',
  PHYSIOTHERAPY: 'Fisioterapia',
  OTHER: 'Otra especialidad',
}

const URGENCY_CONFIG: Record<string, { label: string; cls: string }> = {
  URGENT:   { label: 'Urgente',    cls: 'bg-danger/10 text-danger border-danger/20' },
  PRIORITY: { label: 'Prioritaria', cls: 'bg-warning/10 text-warning border-warning/20' },
  ROUTINE:  { label: 'Rutina',     cls: 'bg-surface-muted text-foreground-muted border-border' },
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; accent: string }> = {
  PENDING:     { label: 'Pendiente',   icon: <Clock className="h-3.5 w-3.5" />,      accent: 'border-l-warning' },
  ACCEPTED:    { label: 'Aceptada',    icon: <CheckCircle2 className="h-3.5 w-3.5" />, accent: 'border-l-primary' },
  IN_PROGRESS: { label: 'En progreso', icon: <RotateCcw className="h-3.5 w-3.5" />,   accent: 'border-l-primary' },
  COMPLETED:   { label: 'Completada',  icon: <CheckCircle2 className="h-3.5 w-3.5" />, accent: 'border-l-success' },
  CANCELLED:   { label: 'Cancelada',   icon: <XCircle className="h-3.5 w-3.5" />,      accent: 'border-l-border' },
}

const STATUS_TEXT: Record<string, string> = {
  PENDING:     'text-warning',
  ACCEPTED:    'text-primary',
  IN_PROGRESS: 'text-primary',
  COMPLETED:   'text-success',
  CANCELLED:   'text-foreground-subtle',
}

export function PatientReferrals({ patientId }: { patientId: string }) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/referrals?patientId=${patientId}`)
      .then(r => r.json())
      .then(data => setReferrals(Array.isArray(data) ? data : []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    )
  }

  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Share2 className="h-10 w-10 text-border mb-3" />
        <p className="text-sm font-medium text-foreground-muted">Sin derivaciones registradas</p>
        <p className="text-xs text-foreground-subtle mt-1">Las derivaciones creadas en consulta aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {referrals.map(ref => {
        const urgency = URGENCY_CONFIG[ref.urgency] ?? { label: ref.urgency, cls: 'bg-surface-alt text-foreground-muted border-border' }
        const status = STATUS_CONFIG[ref.status]
        const statusText = STATUS_TEXT[ref.status] ?? 'text-foreground-muted'
        const specialty = SPECIALTY_LABELS[ref.toSpecialty] ?? ref.toSpecialty

        return (
          <div key={ref.id} className={`panel overflow-hidden border-l-4 ${status?.accent ?? 'border-l-border'}`}>
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-subtle bg-surface-alt/50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{specialty}</span>
                {ref.toDoctor && (
                  <>
                    <ArrowRight className="h-3 w-3 text-foreground-subtle shrink-0" />
                    <span className="text-xs font-medium text-foreground-muted">{ref.toDoctor.name}</span>
                  </>
                )}
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${urgency.cls}`}>
                  {urgency.label}
                </span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 ${statusText}`}>
                {status?.icon}
                {status?.label ?? ref.status}
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">{ref.reason}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-foreground-subtle">
                <span>Deriva: <span className="font-medium text-foreground-muted">{ref.fromDoctor.name}</span></span>
                {ref.consultation && (
                  <span>· Consulta: <span className="font-medium text-foreground-muted">{ref.consultation.reason}</span></span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(ref.createdAt), { locale: es, addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      <Link href="/derivaciones" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline pt-1">
        <Share2 className="h-3 w-3" />
        Ver todas las derivaciones
      </Link>
    </div>
  )
}

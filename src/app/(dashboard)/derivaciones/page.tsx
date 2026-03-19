'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Share2, Clock, CheckCircle2, XCircle, ArrowRightCircle,
  Loader2, ArrowRight, RotateCcw, AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Referral {
  id: string
  toSpecialty: string
  urgency: string
  status: string
  reason: string
  notes: string | null
  createdAt: string
  patient: { id: string; firstName: string; lastName: string }
  fromDoctor: { id: string; name: string; speciality: string | null }
  toDoctor: { id: string; name: string; speciality: string | null } | null
  consultation: { id: string; date: string; reason: string } | null
}

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  PSYCHOLOGY:       'Psicología',
  PSYCHIATRY:       'Psiquiatría',
  NUTRITION:        'Nutrición',
  PHYSIOTHERAPY:    'Fisioterapia',
  OTHER:            'Otra especialidad',
}

const URGENCY_CONFIG: Record<string, { label: string; cls: string }> = {
  URGENT:   { label: 'Urgente',     cls: 'bg-danger/10 text-danger border-danger/20' },
  PRIORITY: { label: 'Prioritaria', cls: 'bg-warning/10 text-warning border-warning/20' },
  ROUTINE:  { label: 'Rutina',      cls: 'bg-surface-muted text-foreground-muted border-border' },
}

const STATUS_CONFIG: Record<string, { label: string; accent: string; textCls: string }> = {
  PENDING:     { label: 'Pendiente',   accent: 'border-l-warning',  textCls: 'text-warning' },
  ACCEPTED:    { label: 'Aceptada',    accent: 'border-l-primary',  textCls: 'text-primary' },
  IN_PROGRESS: { label: 'En progreso', accent: 'border-l-primary',  textCls: 'text-primary' },
  COMPLETED:   { label: 'Completada',  accent: 'border-l-success',  textCls: 'text-success' },
  CANCELLED:   { label: 'Cancelada',   accent: 'border-l-border',   textCls: 'text-foreground-subtle' },
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:     <Clock className="h-3.5 w-3.5" />,
  ACCEPTED:    <CheckCircle2 className="h-3.5 w-3.5" />,
  IN_PROGRESS: <RotateCcw className="h-3.5 w-3.5" />,
  COMPLETED:   <CheckCircle2 className="h-3.5 w-3.5" />,
  CANCELLED:   <XCircle className="h-3.5 w-3.5" />,
}

type Filter = 'received' | 'sent'

export default function DerivacionesPage() {
  const [filter, setFilter] = useState<Filter>('received')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/referrals?filter=${filter}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReferrals(Array.isArray(data) ? data : [])
    } catch {
      setReferrals([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      await fetch(`/api/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Derivaciones</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">Gestión de derivaciones inter-especialidad</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="panel overflow-hidden">
        <div className="flex border-b border-border">
          {(['received', 'sent'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:flex-initial sm:min-w-[120px]',
                filter === f
                  ? 'border-primary text-foreground bg-primary/5'
                  : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-surface-alt'
              )}
            >
              {f === 'received' ? 'Recibidas' : 'Enviadas'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-foreground-subtle" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Share2 className="h-10 w-10 text-border mb-3" />
            <p className="text-sm font-medium text-foreground-muted">
              No hay derivaciones {filter === 'received' ? 'recibidas' : 'enviadas'}
            </p>
            <p className="text-xs text-foreground-subtle mt-1">
              {filter === 'received'
                ? 'Las derivaciones de otros doctores hacia ti aparecerán aquí.'
                : 'Las derivaciones que hayas creado en consulta aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {referrals.map(ref => {
              const urgency = URGENCY_CONFIG[ref.urgency] ?? { label: ref.urgency, cls: 'bg-surface-alt text-foreground-muted border-border' }
              const status = STATUS_CONFIG[ref.status]
              const specialty = SPECIALTY_LABELS[ref.toSpecialty] ?? ref.toSpecialty

              return (
                <div key={ref.id} className={cn('border-l-4 px-5 py-4 transition-colors hover:bg-surface-alt/40', status?.accent ?? 'border-l-border')}>

                  {/* Top: patient + badges */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          href={`/pacientes/${ref.patient.id}`}
                          className="text-sm font-bold text-foreground hover:text-primary hover:underline"
                        >
                          {ref.patient.firstName} {ref.patient.lastName}
                        </Link>
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold', urgency.cls)}>
                          {urgency.label}
                        </span>
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold', status?.textCls ?? 'text-foreground-muted')}>
                          {STATUS_ICON[ref.status]}
                          {status?.label ?? ref.status}
                        </span>
                      </div>

                      {/* Routing: from → specialty / doctor */}
                      <div className="flex items-center gap-1.5 text-xs text-foreground-muted flex-wrap">
                        <span className="font-medium text-foreground-muted">{ref.fromDoctor.name}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-foreground-subtle" />
                        <span className="font-semibold text-foreground">
                          {specialty}{ref.toDoctor ? ` · ${ref.toDoctor.name}` : ''}
                        </span>
                        <span className="ml-2 flex items-center gap-1 text-foreground-subtle">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ref.createdAt), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mt-3 rounded-[var(--radius-sm)] border border-border bg-surface-alt/60 px-3 py-2.5">
                    <p className="text-sm text-foreground leading-relaxed">{ref.reason}</p>
                    {ref.notes && (
                      <p className="mt-1 text-xs text-foreground-muted italic border-t border-border-subtle pt-1">{ref.notes}</p>
                    )}
                  </div>

                  {/* Consultation link */}
                  {ref.consultation && (
                    <p className="mt-2 text-xs text-foreground-muted">
                      Consulta: <Link href={`/pacientes/${ref.patient.id}`} className="text-primary hover:underline">{ref.consultation.reason}</Link>
                    </p>
                  )}

                  {/* Action buttons */}
                  {filter === 'received' && ref.status === 'PENDING' && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border-subtle">
                      <button
                        onClick={() => updateStatus(ref.id, 'ACCEPTED')}
                        disabled={updatingId === ref.id}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-success/30 bg-success/5 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      >
                        {updatingId === ref.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Aceptar derivación
                      </button>
                      <button
                        onClick={() => updateStatus(ref.id, 'CANCELLED')}
                        disabled={updatingId === ref.id}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-surface-alt transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Rechazar
                      </button>
                    </div>
                  )}
                  {filter === 'received' && ref.status === 'ACCEPTED' && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border-subtle">
                      <button
                        onClick={() => updateStatus(ref.id, 'IN_PROGRESS')}
                        disabled={updatingId === ref.id}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {updatingId === ref.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRightCircle className="h-3 w-3" />}
                        Iniciar atención
                      </button>
                      <button
                        onClick={() => updateStatus(ref.id, 'COMPLETED')}
                        disabled={updatingId === ref.id}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-success/30 bg-success/5 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Completar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

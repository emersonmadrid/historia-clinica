'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Share2, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Referral {
  id: string
  toSpecialty: string
  urgency: string
  status: string
  reason: string
  createdAt: string
  patient: { id: string; firstName: string; lastName: string }
  fromDoctor: { name: string }
}

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  PSYCHOLOGY:       'Psicología',
  PSYCHIATRY:       'Psiquiatría',
  NUTRITION:        'Nutrición',
  PHYSIOTHERAPY:    'Fisioterapia',
  OTHER:            'Otra especialidad',
}

const URGENCY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  URGENT:   { label: 'Urgente',     cls: 'text-danger font-bold',        dot: 'bg-danger' },
  PRIORITY: { label: 'Prioritaria', cls: 'text-warning font-semibold',   dot: 'bg-warning' },
  ROUTINE:  { label: 'Rutina',      cls: 'text-foreground-subtle',       dot: 'bg-border-interactive' },
}

export function PendingReferralsWidget() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch pending derivations directed to the current user (filter=received)
    fetch('/api/referrals?filter=received&status=PENDING')
      .then(r => r.json())
      .then(data => setReferrals(Array.isArray(data) ? data : []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false))
  }, [])

  // If loading done and no pending referrals, render nothing — saves space
  if (!loading && referrals.length === 0) return null

  const urgentCount = referrals.filter(r => r.urgency === 'URGENT').length

  return (
    <section className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-alt/80 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-foreground-subtle" />
          <h2 className="text-sm font-semibold text-foreground">Derivaciones pendientes</h2>
          {referrals.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
              {referrals.length}
            </span>
          )}
        </div>
        <Link href="/derivaciones" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Gestionar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Urgent alert banner */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-2 border-b border-danger/10 bg-danger/5 px-5 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger" />
          <p className="text-xs font-semibold text-danger">
            {urgentCount === 1 ? '1 derivación urgente requiere atención inmediata' : `${urgentCount} derivaciones urgentes requieren atención inmediata`}
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2].map(i => (
            <div key={i} className="h-14 animate-pulse rounded bg-surface-alt" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {referrals.slice(0, 5).map(ref => {
            const urgency = URGENCY_CONFIG[ref.urgency] ?? URGENCY_CONFIG.ROUTINE

            return (
              <Link
                key={ref.id}
                href={`/derivaciones`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-alt/60 transition-colors"
              >
                {/* Urgency dot */}
                <div className="mt-1.5 shrink-0">
                  <span className={`block h-2 w-2 rounded-full ${urgency.dot}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {ref.patient.firstName} {ref.patient.lastName}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {SPECIALTY_LABELS[ref.toSpecialty] ?? ref.toSpecialty}
                    {' · '}de {ref.fromDoctor.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-subtle line-clamp-1">{ref.reason}</p>
                </div>

                {/* Urgency + time */}
                <div className="shrink-0 text-right">
                  <p className={`text-xs ${urgency.cls}`}>{urgency.label}</p>
                  <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-foreground-subtle">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(ref.createdAt), { locale: es, addSuffix: true })}
                  </p>
                </div>
              </Link>
            )
          })}

          {referrals.length > 5 && (
            <div className="px-5 py-3">
              <Link href="/derivaciones" className="text-xs font-medium text-primary hover:underline">
                Ver {referrals.length - 5} derivaciones más →
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

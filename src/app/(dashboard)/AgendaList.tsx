'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { appointmentStatusLabel } from '@/lib/utils'
import { CheckCircle2, Stethoscope } from 'lucide-react'

type Apt = {
  id: string
  dateTime: string | Date
  status: string
  reason: string
  arrivedAt: string | Date | null
  patient: { id: string; firstName: string; lastName: string }
}

function statusDot(s: string) {
  return (
    {
      CONFIRMED: '#10B981',
      SCHEDULED: '#9CA3AF',
      CANCELLED: '#EF4444',
      COMPLETED: '#0EA5E9',
      NO_SHOW: '#F59E0B',
    }[s] ?? '#9CA3AF'
  )
}

function statusVariant(s: string) {
  const m: Record<string, string> = {
    SCHEDULED: 'secondary',
    CONFIRMED: 'success',
    CANCELLED: 'destructive',
    COMPLETED: 'default',
    NO_SHOW: 'outline',
  }
  return (m[s] ?? 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function AgendaList({
  appointments,
  userRole,
}: {
  appointments: Apt[]
  userRole: string
}) {
  const router = useRouter()
  // Track local arrivedAt for optimistic UI (key: appointmentId)
  const [arrivedMap, setArrivedMap] = useState<Record<string, Date>>(() => {
    const m: Record<string, Date> = {}
    appointments.forEach(a => {
      if (a.arrivedAt) m[a.id] = new Date(a.arrivedAt)
    })
    return m
  })
  const [loadingArrive, setLoadingArrive] = useState<string | null>(null)

  const canMarkArrival = ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole)
  const canAttend = ['ADMIN', 'DOCTOR'].includes(userRole)

  const handleArrive = async (id: string) => {
    setLoadingArrive(id)
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'arrive' }),
      })
      if (res.ok) {
        setArrivedMap(prev => ({ ...prev, [id]: new Date() }))
        router.refresh()
      }
    } finally {
      setLoadingArrive(null)
    }
  }

  return (
    <div className="relative px-5">
      {/* Vertical timeline line */}
      <div
        className="absolute top-2 bottom-2"
        style={{ left: '68px', width: '1px', backgroundColor: 'var(--border)' }}
      />
      <div className="space-y-1">
        {appointments.map(apt => {
          const time = new Date(apt.dateTime).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const arrived = arrivedMap[apt.id]

          return (
            <div key={apt.id} className="flex items-start gap-3 py-1.5 group">
              {/* Time */}
              <span
                className="w-10 shrink-0 text-right text-xs font-mono pt-2"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                {time}
              </span>

              {/* Dot */}
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center mt-1.5">
                <div
                  className="h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: arrived ? '#10B981' : statusDot(apt.status) }}
                />
              </div>

              {/* Card */}
              <div
                className="flex flex-1 min-w-0 flex-col rounded-lg px-3 py-2 transition-colors group-hover:bg-white gap-1"
                style={{ backgroundColor: 'var(--background)' }}
              >
                {/* Row 1: name + status */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <Link
                    href={`/pacientes/${apt.patient.id}`}
                    className="text-sm font-medium truncate transition-colors group-hover:text-[#0EA5E9]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {apt.patient.firstName} {apt.patient.lastName}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {arrived && (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Llegó {arrived.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <Badge variant={statusVariant(apt.status)}>
                      {appointmentStatusLabel(apt.status)}
                    </Badge>
                  </div>
                </div>

                {/* Row 2: reason */}
                {apt.reason && (
                  <p className="text-[11px] truncate" style={{ color: 'var(--foreground-muted)' }}>
                    {apt.reason}
                  </p>
                )}

                {/* Row 3: action buttons */}
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Llegó */}
                  {canMarkArrival && !arrived && (
                    <button
                      onClick={() => handleArrive(apt.id)}
                      disabled={loadingArrive === apt.id}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {loadingArrive === apt.id ? 'Marcando...' : 'Llegó'}
                    </button>
                  )}

                  {/* Atender */}
                  {canAttend && (
                    <Link
                      href={`/pacientes/${apt.patient.id}/historia/nueva-consulta?citaId=${apt.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                    >
                      <Stethoscope className="h-3 w-3" />
                      Atender
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      CONFIRMED: 'var(--success)',
      SCHEDULED: 'var(--foreground-subtle)',
      CANCELLED: 'var(--danger)',
      COMPLETED: 'var(--primary)',
      NO_SHOW: 'var(--warning)',
    }[s] ?? 'var(--foreground-subtle)'
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
      <div className="absolute top-2 bottom-2 w-px bg-border" style={{ left: '68px' }} />
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
              <span className="w-10 shrink-0 text-right text-xs font-mono pt-2 text-foreground-subtle">
                {time}
              </span>

              {/* Dot */}
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center mt-1.5">
                <div
                  className="h-2 w-2 rounded-full ring-2 ring-surface"
                  style={{ backgroundColor: arrived ? 'var(--success)' : statusDot(apt.status) }}
                />
              </div>

              {/* Card */}
              <div className="flex flex-1 min-w-0 flex-col rounded-lg px-3 py-2 transition-colors group-hover:bg-background gap-1">
                {/* Row 1: name + status */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <Link
                    href={`/pacientes/${apt.patient.id}`}
                    className="text-sm font-medium truncate text-foreground transition-colors hover:text-primary"
                  >
                    {apt.patient.firstName} {apt.patient.lastName}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {arrived && (
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-border-subtle px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
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
                  <p className="text-[11px] truncate text-foreground-muted">
                    {apt.reason}
                  </p>
                )}

                {/* Row 3: action buttons */}
                <div className="flex items-center gap-2 mt-0.5">
                  {canMarkArrival && !arrived && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArrive(apt.id)}
                      disabled={loadingArrive === apt.id}
                      className="h-6 px-2 text-[11px]"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {loadingArrive === apt.id ? 'Marcando...' : 'Llegó'}
                    </Button>
                  )}

                  {canAttend && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                    <Button variant="default" size="sm" asChild className="h-6 px-2 text-[11px]">
                      <Link href={`/pacientes/${apt.patient.id}/historia/nueva-consulta?citaId=${apt.id}`}>
                        <Stethoscope className="h-3 w-3" />
                        Atender
                      </Link>
                    </Button>
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

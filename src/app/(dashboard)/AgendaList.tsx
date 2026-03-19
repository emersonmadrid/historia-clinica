'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Stethoscope, MessageCircle, Clock, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type Apt = {
  id: string
  dateTime: string | Date
  status: string
  reason: string | null
  arrivedAt: string | Date | null
  patient: { id: string; firstName: string; lastName: string; phone?: string | null }
}

type AptState = 'past' | 'next' | 'upcoming' | 'arrived' | 'done'

function classifyApt(apt: Apt, now: Date, isFirst: boolean): AptState {
  const t = new Date(apt.dateTime)
  if (apt.status === 'COMPLETED') return 'done'
  if (apt.arrivedAt) return 'arrived'
  if (t < now && isFirst) return 'next'
  if (t < now) return 'past'
  if (isFirst) return 'next'
  return 'upcoming'
}

export function AgendaList({
  appointments,
  userRole,
}: {
  appointments: Apt[]
  userRole: string
}) {
  const router = useRouter()
  const [now, setNow] = useState(() => new Date())
  const [arrivedMap, setArrivedMap] = useState<Record<string, Date>>(() => {
    const m: Record<string, Date> = {}
    appointments.forEach(a => { if (a.arrivedAt) m[a.id] = new Date(a.arrivedAt) })
    return m
  })
  const [loadingArrive, setLoadingArrive] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

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

  const firstActiveIdx = appointments.findIndex(a => {
    const t = new Date(a.dateTime)
    return a.status !== 'COMPLETED' && (t >= now || a.arrivedAt)
  })

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-alt)]">
          <Clock className="h-6 w-6 text-[var(--foreground-subtle)]" />
        </div>
        <p className="mt-4 text-sm text-[var(--foreground-muted)]">Sin citas para hoy</p>
        <Link href="/citas/nueva" className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline">
          Agendar una cita
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {appointments.map((apt, idx) => {
        const time = new Date(apt.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
        const arrived = arrivedMap[apt.id]
        const isFirst = idx === firstActiveIdx
        const state = classifyApt({ ...apt, arrivedAt: arrived ?? apt.arrivedAt }, now, isFirst)
        const isDone = state === 'done'
        const isNext = state === 'next' || state === 'arrived'
        const canAct = !isDone && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')

        return (
          <div
            key={apt.id}
            className={cn(
              'group flex items-center gap-4 px-5 py-4 transition-colors',
              isDone ? 'opacity-40' : 'hover:bg-[var(--surface-alt)]',
              isNext && 'bg-[var(--primary-subtle)]'
            )}
          >
            {/* Time */}
            <div className="w-12 shrink-0 text-right">
              <span className={cn(
                'font-mono text-sm tabular',
                isNext ? 'font-semibold text-[var(--primary)]' : 'text-[var(--foreground-subtle)]'
              )}>
                {time}
              </span>
            </div>

            {/* State dot */}
            <div className="flex items-center justify-center">
              <div className={cn(
                'h-2.5 w-2.5 rounded-full',
                isDone    ? 'bg-emerald-500' :
                arrived   ? 'bg-amber-500 animate-pulse' :
                isNext    ? 'bg-[var(--primary)]' :
                'bg-[var(--border-interactive)]'
              )} />
            </div>

            {/* Patient info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/pacientes/${apt.patient.id}`}
                  className="truncate text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                >
                  {apt.patient.firstName} {apt.patient.lastName}
                </Link>
                {arrived && !isDone && (
                  <span className="hidden shrink-0 items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 sm:inline-flex">
                    <UserCheck className="h-3 w-3" />
                    En sala
                  </span>
                )}
              </div>
              {apt.reason && (
                <p className="mt-0.5 truncate text-xs text-[var(--foreground-subtle)]">{apt.reason}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {canAct && canMarkArrival && !arrived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArrive(apt.id)}
                  disabled={loadingArrive === apt.id}
                  className="hidden sm:inline-flex h-8 px-3 text-xs"
                >
                  {loadingArrive === apt.id ? '...' : 'Check-in'}
                </Button>
              )}
              {canAct && canAttend && (
                <Button
                  variant={isNext ? 'default' : 'outline'}
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs"
                >
                  <Link href={`/pacientes/${apt.patient.id}/historia/nueva-consulta?citaId=${apt.id}`}>
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                    Atender
                  </Link>
                </Button>
              )}
              {apt.patient.phone && !isDone && (
                <a
                  href={`https://wa.me/${apt.patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${apt.patient.firstName}, le recordamos su cita médica programada para hoy.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden h-8 w-8 items-center justify-center rounded-md border border-transparent text-[var(--foreground-subtle)] transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 sm:flex"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

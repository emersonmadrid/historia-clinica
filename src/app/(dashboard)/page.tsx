import { auth } from '@/lib/auth'
import { getActorContext } from '@/lib/authz'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { AgendaList } from './AgendaList'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function getTodayAppointments(organizationId: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  return prisma.appointment.findMany({
    where: {
      dateTime: { gte: startOfDay, lt: endOfDay },
      status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
      patient: { organizationId },
    },
    orderBy: { dateTime: 'asc' },
    take: 50,
    include: { patient: { select: { id: true, firstName: true, lastName: true, phone: true } } },
  })
}

export default async function DashboardPage() {
  const session = await auth()
  const actor = await getActorContext(session)
  const appointments = await getTodayAppointments(actor.organizationId)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const name = (session?.user?.name ?? '').replace(/^Dr\.?\s+/i, '').split(' ')[0]
  const dateLabel = format(now, "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {greeting}, <span className="text-[var(--primary)]">Dr. {name}</span>
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)] capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/pacientes/nuevo">
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo paciente
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/citas/nueva">
              <Calendar className="mr-1.5 h-4 w-4" />
              Nueva cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Agenda */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--foreground-subtle)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Agenda de hoy</h2>
          </div>
          <Link href="/citas" className="text-xs font-medium text-[var(--primary)] hover:underline">
            Ver todas →
          </Link>
        </div>

        <AgendaList
          appointments={appointments.map(a => ({
            ...a,
            dateTime: a.dateTime.toISOString(),
            arrivedAt: a.arrivedAt ? a.arrivedAt.toISOString() : null,
          }))}
          userRole={session?.user?.role ?? 'DOCTOR'}
        />
      </div>

    </div>
  )
}

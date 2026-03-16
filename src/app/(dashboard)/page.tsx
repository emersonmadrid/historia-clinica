import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, ClipboardList, Clock, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate, appointmentStatusLabel } from '@/lib/utils'

async function getDashboardData() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalPatients, todayAppointments, monthConsultations, pendingAppointments, upcomingAppointments, recentConsultations] =
    await Promise.all([
      prisma.patient.count({ where: { active: true } }),
      prisma.appointment.count({ where: { dateTime: { gte: startOfDay, lt: endOfDay } } }),
      prisma.clinicalRecord.count({ where: { date: { gte: startOfMonth } } }),
      prisma.appointment.count({
        where: { dateTime: { gte: startOfDay, lt: endOfDay }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
      }),
      prisma.appointment.findMany({
        where: { dateTime: { gte: startOfDay, lt: endOfDay }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        orderBy: { dateTime: 'asc' },
        take: 8,
        include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.clinicalRecord.findMany({
        orderBy: { date: 'desc' },
        take: 6,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { name: true } },
          diagnoses: { take: 1 },
        },
      }),
    ])

  return { stats: { totalPatients, todayAppointments, monthConsultations, pendingAppointments }, upcomingAppointments, recentConsultations }
}

function statusVariant(s: string) {
  const m: Record<string, string> = { SCHEDULED: 'secondary', CONFIRMED: 'success', CANCELLED: 'destructive', COMPLETED: 'default', NO_SHOW: 'outline' }
  return (m[s] ?? 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

function statusDot(s: string) {
  return {
    CONFIRMED: '#10B981',
    SCHEDULED: '#9CA3AF',
    CANCELLED: '#EF4444',
    COMPLETED: '#0EA5E9',
    NO_SHOW: '#F59E0B',
  }[s] ?? '#9CA3AF'
}

export default async function DashboardPage() {
  const session = await auth()
  const { stats, upcomingAppointments, recentConsultations } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const name = (session?.user?.name ?? '').replace(/^Dr\.?\s+/i, '').split(' ')[0]

  const statCards = [
    { label: 'Pacientes activos',   value: stats.totalPatients,       icon: Users,         color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
    { label: 'Citas hoy',           value: stats.todayAppointments,   icon: Calendar,      color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Consultas del mes',   value: stats.monthConsultations,  icon: ClipboardList, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)'  },
    { label: 'Pendientes hoy',      value: stats.pendingAppointments, icon: Clock,         color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  ]

  return (
    <div className="space-y-5">

      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--foreground-subtle)' }}>
            {greeting}
          </p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
            Dr. {name}
          </h1>
          <p className="text-xs mt-1 capitalize" style={{ color: 'var(--foreground-muted)' }}>
            {formatDate(now, "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pacientes/nuevo"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-600"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo paciente
          </Link>
          <Link
            href="/citas/nueva"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-white"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <Calendar className="h-3.5 w-3.5" />
            Nueva cita
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide truncate" style={{ color: 'var(--foreground-subtle)' }}>
                      {card.label}
                    </p>
                    <p className="mt-2 text-4xl font-bold tabular leading-none" style={{ color: 'var(--foreground)' }}>
                      {card.value}
                    </p>
                  </div>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: card.bg }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: card.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">

        {/* Agenda — 3/5 */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">Agenda de hoy</CardTitle>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                {upcomingAppointments.length} citas pendientes
              </p>
            </div>
            <Link
              href="/citas"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 pb-2">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full mb-3" style={{ backgroundColor: 'var(--background)' }}>
                  <Calendar className="h-5 w-5" style={{ color: 'var(--foreground-subtle)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Sin citas para hoy</p>
                <Link href="/citas/nueva" className="mt-2 text-xs font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                  Agendar una cita
                </Link>
              </div>
            ) : (
              <div>
                {/* Timeline */}
                <div className="relative px-5">
                  {/* Vertical line */}
                  <div
                    className="absolute top-2 bottom-2"
                    style={{ left: '68px', width: '1px', backgroundColor: 'var(--border)' }}
                  />
                  <div className="space-y-1">
                    {upcomingAppointments.map((apt) => {
                      const time = new Date(apt.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                      const dot = statusDot(apt.status)
                      return (
                        <div key={apt.id} className="flex items-center gap-3 py-1.5 group">
                          {/* Time */}
                          <span className="w-10 shrink-0 text-right text-xs font-mono" style={{ color: 'var(--foreground-subtle)' }}>
                            {time}
                          </span>

                          {/* Dot */}
                          <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                            <div
                              className="h-2 w-2 rounded-full ring-2 ring-white"
                              style={{ backgroundColor: dot }}
                            />
                          </div>

                          {/* Row */}
                          <div
                            className="flex flex-1 min-w-0 items-center justify-between rounded-lg px-3 py-2 transition-colors group-hover:bg-white"
                            style={{ backgroundColor: 'var(--background)' }}
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/pacientes/${apt.patient.id}`}
                                className="text-sm font-medium truncate block transition-colors group-hover:text-[#0EA5E9]"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {apt.patient.firstName} {apt.patient.lastName}
                              </Link>
                              {apt.reason && (
                                <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                                  {apt.reason}
                                </p>
                              )}
                            </div>
                            <Badge variant={statusVariant(apt.status)} className="ml-3 shrink-0">
                              {appointmentStatusLabel(apt.status)}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad reciente — 2/5 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-semibold">Actividad reciente</CardTitle>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                Últimas consultas registradas
              </p>
            </div>
            <Link
              href="/pacientes"
              className="flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Ver todo <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 pb-3 px-5">
            {recentConsultations.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ClipboardList className="h-8 w-8 mb-2" style={{ color: 'var(--foreground-subtle)' }} />
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Sin consultas recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConsultations.map((record, i) => {
                  const dx = record.diagnoses[0]
                  const initials = `${record.patient.firstName[0] ?? ''}${record.patient.lastName[0] ?? ''}`
                  return (
                    <div
                      key={record.id}
                      className={`flex items-start gap-3 pb-3 ${i < recentConsultations.length - 1 ? 'border-b' : ''}`}
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        {initials.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/pacientes/${record.patient.id}`}
                          className="text-sm font-semibold truncate block hover:underline"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {record.patient.firstName} {record.patient.lastName}
                        </Link>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                          {dx ? `${dx.code} · ${dx.description}` : record.reason}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
                          {formatDate(record.date)} · {record.doctor.name}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

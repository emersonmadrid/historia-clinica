import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ClipboardList, ArrowRight, Plus, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { AgendaList } from './AgendaList'

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

export default async function DashboardPage() {
  const session = await auth()
  const { stats, upcomingAppointments, recentConsultations } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const name = (session?.user?.name ?? '').replace(/^Dr\.?\s+/i, '').split(' ')[0]

  return (
    <div className="space-y-5">
      <section className="border border-border bg-surface px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Centro clínico de Dr. {name}
            </h1>
            <p className="mt-2 text-xs capitalize tracking-wide text-foreground-subtle">
              {formatDate(now, "EEEE, d 'de' MMMM 'de' yyyy")}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/pacientes/nuevo">
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo paciente
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/citas/nueva">
              <Calendar className="mr-1.5 h-4 w-4" />
              Nueva cita
            </Link>
          </Button>
        </div>
      </section>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Pacientes activos',  value: stats.totalPatients,       icon: Users,         href: '/pacientes' },
          { label: 'Citas hoy',          value: stats.todayAppointments,   icon: Calendar,      href: '/citas' },
          { label: 'Consultas del mes',  value: stats.monthConsultations,  icon: ClipboardList, href: '/pacientes' },
          { label: 'Pendientes hoy',     value: stats.pendingAppointments, icon: Clock,         href: '/citas' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center justify-between border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-interactive hover:bg-surface-alt"
          >
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">{label}</p>
              <p className="mt-1 text-3xl font-bold tabular text-foreground">{value}</p>
            </div>
            <Icon className="h-5 w-5 shrink-0 text-border-interactive group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="overflow-hidden rounded-none">
          <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border bg-surface-alt pb-4">
            <div>
              <CardTitle className="text-base">Agenda operativa</CardTitle>
              <p className="mt-1 text-[12px] text-foreground-muted">
                Pacientes que requieren preparación o atención hoy
              </p>
            </div>
            <Link
              href="/citas"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 pb-3">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-background">
                  <Calendar className="h-5 w-5 text-foreground-subtle" />
                </div>
                <p className="text-sm text-foreground-muted">Sin citas para hoy</p>
                <Link href="/citas/nueva" className="mt-2 text-xs font-medium text-primary hover:underline">
                  Agendar una cita
                </Link>
              </div>
            ) : (
              <AgendaList
                appointments={upcomingAppointments.map(a => ({
                  ...a,
                  dateTime: a.dateTime.toISOString(),
                  arrivedAt: a.arrivedAt ? a.arrivedAt.toISOString() : null,
                }))}
                userRole={session?.user?.role ?? 'DOCTOR'}
              />
            )}
          </CardContent>
        </Card>

        <div>
          <Card className="rounded-none">
            <CardHeader className="border-b border-border bg-surface-alt pb-4">
              <CardTitle className="text-base">Actividad reciente</CardTitle>
              <p className="text-[12px] text-foreground-muted">Últimas consultas registradas y contexto inmediato</p>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-5">
              {recentConsultations.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ClipboardList className="mb-2 h-8 w-8 text-foreground-subtle" />
                  <p className="text-sm text-foreground-muted">Sin consultas recientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConsultations.map((record) => {
                    const dx = record.diagnoses[0]
                    const initials = `${record.patient.firstName[0] ?? ''}${record.patient.lastName[0] ?? ''}`
                    return (
                      <div
                        key={record.id}
                        className="border border-border bg-surface-alt p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-700 text-[11px] font-bold text-white">
                            {initials.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/pacientes/${record.patient.id}`}
                              className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                            >
                              {record.patient.firstName} {record.patient.lastName}
                            </Link>
                            <p className="mt-1 truncate text-[12px] text-foreground-muted">
                              {dx ? `${dx.code} · ${dx.description}` : record.reason}
                            </p>
                            <p className="mt-2 text-[11px] text-foreground-subtle">
                              {formatDate(record.date)} · {record.doctor.name}
                            </p>
                          </div>
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
    </div>
  )
}

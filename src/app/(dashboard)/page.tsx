import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, ClipboardList, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, formatDate, appointmentStatusLabel } from '@/lib/utils'

async function getDashboardData() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalPatients, todayAppointments, monthConsultations, pendingAppointments, upcomingAppointments, recentConsultations] =
    await Promise.all([
      prisma.patient.count({ where: { active: true } }),
      prisma.appointment.count({
        where: { dateTime: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.clinicalRecord.count({
        where: { date: { gte: startOfMonth } },
      }),
      prisma.appointment.count({
        where: {
          dateTime: { gte: startOfDay, lt: endOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      prisma.appointment.findMany({
        where: {
          dateTime: { gte: startOfDay, lt: endOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        orderBy: { dateTime: 'asc' },
        take: 8,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true } },
        },
      }),
      prisma.clinicalRecord.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true } },
          diagnoses: { take: 1 },
        },
      }),
    ])

  return {
    stats: { totalPatients, todayAppointments, monthConsultations, pendingAppointments },
    upcomingAppointments,
    recentConsultations,
  }
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'secondary',
    CONFIRMED: 'success',
    CANCELLED: 'destructive',
    COMPLETED: 'default',
    NO_SHOW: 'outline',
  }
  return (map[status] || 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline'
}

export default async function DashboardPage() {
  const session = await auth()
  const { stats, upcomingAppointments, recentConsultations } = await getDashboardData()

  const statCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Pacientes activos registrados',
    },
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
      description: 'Citas programadas para hoy',
    },
    {
      title: 'Consultas del Mes',
      value: stats.monthConsultations,
      icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      description: 'Consultas realizadas este mes',
    },
    {
      title: 'Citas Pendientes',
      value: stats.pendingAppointments,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      description: 'Pendientes de atención hoy',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Bienvenido, {session?.user?.name?.split(' ')[0]}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {formatDate(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{card.description}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Citas de Hoy</CardTitle>
            <Link
              href="/citas"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingAppointments.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">No hay citas programadas para hoy.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <span className="text-xs font-semibold text-blue-700">
                        {new Date(apt.dateTime).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/pacientes/${apt.patient.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block"
                      >
                        {apt.patient.firstName} {apt.patient.lastName}
                      </Link>
                      <p className="text-xs text-slate-500 truncate">{apt.reason}</p>
                    </div>
                    <Badge variant={statusColor(apt.status)} className="shrink-0 text-xs">
                      {appointmentStatusLabel(apt.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Consultations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Consultas Recientes</CardTitle>
            <Link
              href="/pacientes"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver pacientes
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentConsultations.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">No hay consultas recientes.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentConsultations.map((record) => (
                  <div key={record.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-xs font-semibold text-slate-600">
                        {record.patient.firstName[0]}{record.patient.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/pacientes/${record.patient.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block"
                      >
                        {record.patient.firstName} {record.patient.lastName}
                      </Link>
                      <p className="text-xs text-slate-500 truncate">{record.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">{formatDate(record.date)}</p>
                      <p className="text-xs text-slate-400">{record.doctor.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

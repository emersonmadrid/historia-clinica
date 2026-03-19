import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { handleApiError } from '@/lib/errors'
import { startOfMonth, subMonths, startOfWeek, subWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET() {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const now = new Date()

    // --- Consultas por mes (últimos 6 meses) ---
    const monthsData: { mes: string; cantidad: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(now, i))
      const end = startOfMonth(subMonths(now, i - 1))
      const count = await prisma.clinicalRecord.count({
        where: { date: { gte: start, lt: end }, patient: { organizationId: actor.organizationId } },
      })
      monthsData.push({
        mes: format(start, 'MMM yyyy', { locale: es }),
        cantidad: count,
      })
    }

    // --- Citas por estado ---
    const appointmentGroups = await prisma.appointment.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { patient: { organizationId: actor.organizationId } },
    })

    const statusLabels: Record<string, string> = {
      SCHEDULED: 'Agendada',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No asistió',
    }

    const citasPorEstado = appointmentGroups.map((g) => ({
      estado: statusLabels[g.status] || g.status,
      cantidad: g._count.status,
    }))

    // --- Pacientes por género ---
    const genderGroups = await prisma.patient.groupBy({
      by: ['gender'],
      _count: { gender: true },
      where: { active: true, organizationId: actor.organizationId },
    })

    const genderLabels: Record<string, string> = {
      MALE: 'Masculino',
      FEMALE: 'Femenino',
      OTHER: 'Otro',
    }

    const pacientesPorGenero = genderGroups.map((g) => ({
      genero: genderLabels[g.gender] || g.gender,
      cantidad: g._count.gender,
    }))

    // --- Citas por semana (últimas 8 semanas) ---
    const weeksData: { semana: string; cantidad: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
      const end = startOfWeek(subWeeks(now, i - 1), { weekStartsOn: 1 })
      const count = await prisma.appointment.count({
        where: { dateTime: { gte: start, lt: end }, patient: { organizationId: actor.organizationId } },
      })
      weeksData.push({
        semana: format(start, 'dd/MM', { locale: es }),
        cantidad: count,
      })
    }

    return NextResponse.json({
      consultasPorMes: monthsData,
      citasPorEstado,
      pacientesPorGenero,
      citasPorSemana: weeksData,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

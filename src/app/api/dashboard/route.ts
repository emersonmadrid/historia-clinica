import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActorContext } from '@/lib/authz'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const actor = await getActorContext(session)

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPatients, todayAppointments, monthConsultations, pendingAppointments] =
      await Promise.all([
        prisma.patient.count({ where: { active: true, organizationId: actor.organizationId } }),
        prisma.appointment.count({
          where: {
            dateTime: { gte: startOfDay, lt: endOfDay },
            patient: { organizationId: actor.organizationId },
          },
        }),
        prisma.clinicalRecord.count({
          where: {
            date: { gte: startOfMonth },
            patient: { organizationId: actor.organizationId },
          },
        }),
        prisma.appointment.count({
          where: {
            dateTime: { gte: startOfDay, lt: endOfDay },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            patient: { organizationId: actor.organizationId },
          },
        }),
      ])

    return NextResponse.json({
      totalPatients,
      todayAppointments,
      recentConsultations: monthConsultations,
      pendingAppointments,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

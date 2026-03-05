import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalPatients, todayAppointments, monthConsultations, pendingAppointments] =
      await Promise.all([
        prisma.patient.count({ where: { active: true } }),
        prisma.appointment.count({
          where: {
            dateTime: { gte: startOfDay, lt: endOfDay },
          },
        }),
        prisma.clinicalRecord.count({
          where: {
            date: { gte: startOfMonth },
          },
        }),
        prisma.appointment.count({
          where: {
            dateTime: { gte: startOfDay, lt: endOfDay },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
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
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

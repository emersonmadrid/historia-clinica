import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { generateDailyBriefing } from '@/lib/ai'
import { prisma } from '@/lib/prisma'
import { getActorContext } from '@/lib/authz'

// Cache per user, 10 minutes
const cache = new Map<string, { data: unknown; expiresAt: number }>()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const actor = await getActorContext(session)

    const userId = session.user.id
    const hit = cache.get(userId)
    if (hit && hit.expiresAt > Date.now()) return NextResponse.json(hit.data)

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: startOfDay, lt: endOfDay },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        patient: { organizationId: actor.organizationId },
      },
      include: {
        patient: {
          include: {
            allergies: { select: { allergen: true } },
            clinicalRecords: {
              take: 1,
              orderBy: { date: 'desc' },
              select: { date: true, diagnoses: { select: { description: true, status: true } } },
            },
          },
        },
      },
      orderBy: { dateTime: 'asc' },
      take: 30,
    })

    const patients = appointments.map(apt => {
      const lastRecord = apt.patient.clinicalRecords[0]
      const daysSinceLastVisit = lastRecord
        ? Math.floor((now.getTime() - new Date(lastRecord.date).getTime()) / (1000 * 60 * 60 * 24))
        : null
      const activeConditions = lastRecord?.diagnoses
        .filter(d => d.status === 'ACTIVE' || d.status === 'CHRONIC')
        .map(d => d.description) ?? []
      return {
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        reason: apt.reason ?? 'Consulta',
        activeConditions,
        allergies: apt.patient.allergies.map(a => a.allergen),
        daysSinceLastVisit,
      }
    })

    const briefing = await generateDailyBriefing({
      doctorName: session.user.name ?? 'Doctor',
      patients,
    })

    cache.set(userId, { data: briefing, expiresAt: Date.now() + 10 * 60 * 1000 })
    return NextResponse.json(briefing)
  } catch (error) {
    return handleApiError(error)
  }
}

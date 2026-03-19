import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActorContext } from '@/lib/authz'
import { handleApiError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const actor = await getActorContext(session)

    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Pacientes con diagnóstico CRÓNICO y sin visita reciente en los últimos 90 días
    const patients = await prisma.patient.findMany({
      where: {
        active: true,
        organizationId: actor.organizationId,
        clinicalRecords: {
          some: { diagnoses: { some: { status: 'CHRONIC' } } },
          none: { date: { gte: cutoffDate } },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        clinicalRecords: {
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            date: true,
            diagnoses: {
              where: { status: 'CHRONIC' },
              select: { description: true },
              take: 3,
            },
          },
        },
      },
      take: 8,
      orderBy: { clinicalRecords: { _count: 'asc' } },
    })

    const gaps = patients
      .map((p) => {
        const lastDate = p.clinicalRecords[0]?.date ?? null
        const daysSince = lastDate
          ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
          : null
        const chronicConditions = p.clinicalRecords[0]?.diagnoses.map((d) => d.description) ?? []
        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          lastVisit: lastDate ? lastDate.toISOString() : null,
          daysSince,
          chronicConditions,
        }
      })
      .sort((a, b) => (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity))

    return NextResponse.json(gaps)
  } catch (error) {
    return handleApiError(error)
  }
}

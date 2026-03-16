import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { generateBriefing } from '@/lib/ai'
import { calculateAge, genderLabel } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id, active: true },
      include: {
        allergies: true,
        clinicalRecords: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            diagnoses: true,
            prescriptions: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    })

    if (!patient) throw new NotFoundError('Paciente no encontrado')

    const activeConditions = patient.clinicalRecords
      .flatMap(r => r.diagnoses)
      .filter(d => d.status === 'ACTIVE' || d.status === 'CHRONIC')
      .reduce<string[]>((acc, d) => {
        if (!acc.includes(d.description)) acc.push(d.description)
        return acc
      }, [])

    const lastPrescription = patient.clinicalRecords
      .flatMap(r => r.prescriptions)[0]
    const currentMedications = (lastPrescription?.items ?? []).map(
      it => `${it.medication} ${it.dosage}`
    )

    const briefing = await generateBriefing({
      patientName: `${patient.firstName} ${patient.lastName}`,
      age: calculateAge(patient.birthDate),
      gender: genderLabel(patient.gender),
      allergies: patient.allergies.map(a => a.allergen),
      activeConditions,
      currentMedications,
      consultations: patient.clinicalRecords.map(r => ({
        date: r.date.toLocaleDateString('es-PE'),
        reason: r.reason,
        assessment: r.assessment,
        plan: r.plan,
        diagnoses: r.diagnoses.map(d => d.description),
      })),
    })

    return NextResponse.json(briefing)
  } catch (error) {
    console.error('[briefing]', error)
    return handleApiError(error)
  }
}

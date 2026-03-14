import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { createConsultationSchema } from '@/features/consultations/schemas'
import { listConsultations } from '@/features/consultations/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId requerido' }, { status: 400 })
    }

    const records = await listConsultations(patientId)

    return NextResponse.json(records)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR'])

    const body = await request.json()
    const parsed = createConsultationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { vitalSigns, diagnoses, ...consultationData } = parsed.data
    const doctorId = session.user.id

    const record = await prisma.clinicalRecord.create({
      data: {
        ...consultationData,
        doctorId,
        date: new Date(),
        ...(vitalSigns && {
          vitalSigns: {
            create: {
              height: vitalSigns.height ?? null,
              weight: vitalSigns.weight ?? null,
              bmi: vitalSigns.bmi ?? null,
              temperature: vitalSigns.temperature ?? null,
              bloodPressureSys: vitalSigns.bloodPressureSys ?? null,
              bloodPressureDia: vitalSigns.bloodPressureDia ?? null,
              heartRate: vitalSigns.heartRate ?? null,
              oxygenSat: vitalSigns.oxygenSat ?? null,
              respiratoryRate: vitalSigns.respiratoryRate ?? null,
              glucoseLevel: vitalSigns.glucoseLevel ?? null,
            },
          },
        }),
        ...(diagnoses && diagnoses.length > 0 && {
          diagnoses: {
            create: diagnoses.map((d) => ({
              code: d.code,
              description: d.description,
              type: d.type,
              status: d.status,
              notes: d.notes ?? null,
            })),
          },
        }),
      },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        vitalSigns: true,
        diagnoses: true,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

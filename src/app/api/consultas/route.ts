import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { createConsultationSchema } from '@/features/consultations/schemas'
import { listConsultations } from '@/features/consultations/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId requerido' }, { status: 400 })
    }

    const records = await listConsultations(patientId, actor.organizationId)

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
    const actor = await getActorContext(session)

    const body = await request.json()
    const parsed = createConsultationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { vitalSigns, diagnoses, prescriptions, noteTemplate, ...consultationData } = parsed.data
    const doctorId = session.user.id

    const patient = await prisma.patient.findUnique({
      where: { id: consultationData.patientId },
      select: { organizationId: true },
    })
    requireSameOrganization(patient, actor.organizationId, (item) => item.organizationId, 'Paciente no encontrado')

    const record = await prisma.clinicalRecord.create({
      data: {
        ...consultationData,
        doctorId,
        date: new Date(),
        noteTemplate: noteTemplate ?? 'SOAP',
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

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'CONSULTATION_CREATED',
      entityType: 'consultation',
      entityId: record.id,
      ...getRequestAuditContext(request),
      metadata: { patientId: consultationData.patientId },
    })

    // Create prescriptions atomically
    if (prescriptions && prescriptions.length > 0) {
      for (const rx of prescriptions) {
        await prisma.prescription.create({
          data: {
            consultationId: record.id,
            patientId: consultationData.patientId,
            doctorId,
            notes: rx.notes || null,
            items: {
              create: rx.items.map((item) => ({
                medication: item.medication,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                quantity: item.quantity || null,
                instructions: item.instructions || null,
              })),
            },
          },
        })
      }
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { createPrescriptionSchema } from '@/features/prescriptions/schemas'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id: consultationId } = await params

    const prescriptions = await prisma.prescription.findMany({
      where: { consultationId, patient: { organizationId: actor.organizationId } },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        doctor: { select: { id: true, name: true, speciality: true, licenseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])
    const actor = await getActorContext(session)

    const { id: consultationId } = await params

    const consultation = await prisma.clinicalRecord.findUnique({
      where: { id: consultationId },
      include: { patient: { select: { organizationId: true } } },
    })
    const scopedConsultation = requireSameOrganization(
      consultation,
      actor.organizationId,
      (item) => item.patient.organizationId,
      'Consulta no encontrada'
    )

    const body = await request.json()
    const parsed = createPrescriptionSchema.safeParse({ ...body, consultationId })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        patientId: scopedConsultation.patientId,
        doctorId: session!.user.id,
        notes: parsed.data.notes || null,
        items: {
          create: parsed.data.items.map((item) => ({
            medication: item.medication,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity || null,
            instructions: item.instructions || null,
          })),
        },
      },
      include: {
        items: true,
        doctor: { select: { id: true, name: true, speciality: true, licenseNumber: true } },
      },
    })

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PRESCRIPTION_CREATED',
      entityType: 'prescription',
      entityId: prescription.id,
      ...getRequestAuditContext(request),
      metadata: {
        consultationId,
        patientId: scopedConsultation.patientId,
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

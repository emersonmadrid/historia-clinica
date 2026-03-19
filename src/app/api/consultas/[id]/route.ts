import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'
import { vitalSignsSchema, diagnosisSchema } from '@/features/consultations/schemas'

const updateConsultationSchema = z.object({
  reason: z.string().min(1, 'Motivo requerido'),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  vitalSigns: vitalSignsSchema.optional().nullable(),
  diagnoses: z.array(diagnosisSchema).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const record = await prisma.clinicalRecord.findUnique({
      where: { id },
      include: {
        patient: { select: { organizationId: true } },
        doctor: { select: { id: true, name: true, speciality: true } },
        vitalSigns: true,
        diagnoses: true,
        prescriptions: {
          include: {
            items: { orderBy: { createdAt: 'asc' } },
            doctor: { select: { id: true, name: true, speciality: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    requireSameOrganization(record, actor.organizationId, (item) => item.patient.organizationId, 'Consulta no encontrada')

    return NextResponse.json(record)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR'])
    const actor = await getActorContext(session)

    const { id } = await params

    const body = await request.json()
    const parsed = updateConsultationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { vitalSigns, diagnoses, ...consultationData } = parsed.data
    const existing = await prisma.clinicalRecord.findUnique({
      where: { id },
      include: { patient: { select: { organizationId: true } } },
    })
    requireSameOrganization(existing, actor.organizationId, (item) => item.patient.organizationId, 'Consulta no encontrada')

    // Update consultation text fields
    await prisma.clinicalRecord.update({
      where: { id },
      data: consultationData,
    })

    // Upsert vital signs
    if (vitalSigns !== undefined) {
      if (vitalSigns === null) {
        await prisma.vitalSigns.deleteMany({ where: { consultationId: id } })
      } else {
        const hasAnyValue = Object.values(vitalSigns).some(v => v !== null && v !== undefined)
        if (hasAnyValue) {
          await prisma.vitalSigns.upsert({
            where: { consultationId: id },
            create: { consultationId: id, ...vitalSigns },
            update: vitalSigns,
          })
        } else {
          await prisma.vitalSigns.deleteMany({ where: { consultationId: id } })
        }
      }
    }

    // Replace diagnoses (delete all and recreate)
    if (diagnoses !== undefined) {
      await prisma.diagnosis.deleteMany({ where: { consultationId: id } })
      if (diagnoses.length > 0) {
        await prisma.diagnosis.createMany({
          data: diagnoses.map(d => ({
            consultationId: id,
            code: d.code,
            description: d.description,
            type: d.type ?? 'PRIMARY',
            status: d.status ?? 'ACTIVE',
            notes: d.notes ?? null,
          })),
        })
      }
    }

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'CONSULTATION_UPDATED',
      entityType: 'consultation',
      entityId: id,
      ...getRequestAuditContext(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

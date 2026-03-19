import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { createReferralSchema } from '@/features/consultations/schemas'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'sent' | 'received' | null (all)
    const status = searchParams.get('status')  // 'PENDING' | null (all)
    const patientId = searchParams.get('patientId')

    const where: Record<string, unknown> = {
      patient: { organizationId: actor.organizationId },
    }

    if (patientId) {
      where.patientId = patientId
    } else if (filter === 'sent') {
      where.fromDoctorId = actor.userId
    } else if (filter === 'received') {
      where.toDoctorId = actor.userId
    } else {
      where.OR = [{ fromDoctorId: actor.userId }, { toDoctorId: actor.userId }]
    }

    if (status) where.status = status

    const referrals = await prisma.referral.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        fromDoctor: { select: { id: true, name: true, speciality: true } },
        toDoctor: { select: { id: true, name: true, speciality: true } },
        consultation: { select: { id: true, date: true, reason: true } },
      },
    })

    return NextResponse.json(referrals)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const body = await request.json()
    const parsed = createReferralSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { patientId, toSpecialty, reason, urgency, notes, toDoctorId, consultationId } = parsed.data

    // Verify patient belongs to org
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { organizationId: true },
    })
    if (!patient || patient.organizationId !== actor.organizationId) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const referral = await prisma.referral.create({
      data: {
        patientId,
        fromDoctorId: actor.userId,
        toDoctorId: toDoctorId ?? null,
        toSpecialty,
        reason,
        urgency: urgency ?? 'ROUTINE',
        notes: notes ?? null,
        consultationId: consultationId ?? null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        fromDoctor: { select: { id: true, name: true } },
        toDoctor: { select: { id: true, name: true } },
      },
    })

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'REFERRAL_CREATED' as never,
      entityType: 'referral',
      entityId: referral.id,
      ...getRequestAuditContext(request),
      metadata: { patientId, toSpecialty, urgency },
    })

    return NextResponse.json(referral, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

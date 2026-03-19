import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { updateReferralSchema } from '@/features/consultations/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)
    const { id } = await params

    const existing = await prisma.referral.findUnique({
      where: { id },
      select: { fromDoctorId: true, toDoctorId: true, patient: { select: { organizationId: true } } },
    })

    if (!existing || existing.patient.organizationId !== actor.organizationId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const isInvolved = existing.fromDoctorId === actor.userId || existing.toDoctorId === actor.userId
    if (!isInvolved) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateReferralSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const referral = await prisma.referral.update({
      where: { id },
      data: { status: parsed.data.status, notes: parsed.data.notes ?? undefined },
    })

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'REFERRAL_UPDATED' as never,
      entityType: 'referral',
      entityId: id,
      ...getRequestAuditContext(request),
      metadata: { status: parsed.data.status },
    })

    return NextResponse.json(referral)
  } catch (error) {
    return handleApiError(error)
  }
}

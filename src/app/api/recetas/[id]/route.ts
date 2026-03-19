import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])
    const actor = await getActorContext(session)

    const { id } = await params

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { patient: { select: { organizationId: true } } },
    })
    const scopedPrescription = requireSameOrganization(
      prescription,
      actor.organizationId,
      (item) => item.patient.organizationId,
      'Receta no encontrada'
    )

    await prisma.prescription.delete({ where: { id } })

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PRESCRIPTION_DELETED',
      entityType: 'prescription',
      entityId: id,
      ...getRequestAuditContext(_request),
      metadata: { patientId: scopedPrescription.patientId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

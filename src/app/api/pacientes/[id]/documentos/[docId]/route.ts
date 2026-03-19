import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { deletePrivatePatientFile } from '@/lib/private-files'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id, docId } = await params

    const document = await prisma.patientDocument.findFirst({
      where: {
        id: docId,
        patientId: id,
        patient: { organizationId: actor.organizationId },
      },
    })

    if (!document) throw new NotFoundError('Documento no encontrado')

    await deletePrivatePatientFile(id, document.id)

    await prisma.patientDocument.delete({ where: { id: docId } })

    const audit = getRequestAuditContext(_request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'DOCUMENT_DELETED',
      entityType: 'patient_document',
      entityId: docId,
      ...audit,
      metadata: { patientId: id, mimeType: document.mimeType },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

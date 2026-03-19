import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { readPrivatePatientFile } from '@/lib/private-files'

export async function GET(
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

    if (!document) {
      throw new NotFoundError('Documento no encontrado')
    }

    const file = await readPrivatePatientFile(id, document.id)

    const audit = getRequestAuditContext(_request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'DOCUMENT_DOWNLOADED',
      entityType: 'patient_document',
      entityId: document.id,
      ...audit,
      metadata: { patientId: id, mimeType: document.mimeType },
    })

    return new NextResponse(file as unknown as BodyInit, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(document.fileSize),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.name)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

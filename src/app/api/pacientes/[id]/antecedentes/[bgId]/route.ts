import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { handleApiError, NotFoundError } from '@/lib/errors'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; bgId: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])
    const actor = await getActorContext(session)

    const { id, bgId } = await params

    const bg = await prisma.medicalBackground.findFirst({
      where: { id: bgId, patientId: id, patient: { organizationId: actor.organizationId } },
    })

    if (!bg) {
      throw new NotFoundError('Antecedente no encontrado')
    }

    await prisma.medicalBackground.delete({ where: { id: bgId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

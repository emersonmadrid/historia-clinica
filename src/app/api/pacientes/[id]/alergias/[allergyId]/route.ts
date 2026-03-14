import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; allergyId: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])

    const { id, allergyId } = await params

    const allergy = await prisma.allergy.findFirst({
      where: { id: allergyId, patientId: id },
    })

    if (!allergy) {
      throw new NotFoundError('Alergia no encontrada')
    }

    await prisma.allergy.delete({ where: { id: allergyId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

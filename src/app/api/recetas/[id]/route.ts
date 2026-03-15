import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])

    const { id } = await params

    const prescription = await prisma.prescription.findUnique({ where: { id } })
    if (!prescription) throw new NotFoundError('Receta no encontrada')

    await prisma.prescription.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

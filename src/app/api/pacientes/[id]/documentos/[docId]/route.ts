import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)

    const { id, docId } = await params

    const document = await prisma.patientDocument.findUnique({
      where: { id: docId, patientId: id },
    })

    if (!document) throw new NotFoundError('Documento no encontrado')

    // Delete from filesystem
    const filePath = join(process.cwd(), 'public', document.fileUrl)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    await prisma.patientDocument.delete({ where: { id: docId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

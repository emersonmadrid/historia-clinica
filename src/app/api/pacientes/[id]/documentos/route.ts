import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { savePrivatePatientFile } from '@/lib/private-files'
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id, active: true, organizationId: actor.organizationId },
    })
    if (!patient) throw new NotFoundError('Paciente no encontrado')

    const documents = await prisma.patientDocument.findMany({
      where: { patientId: id },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id, active: true, organizationId: actor.organizationId },
    })
    if (!patient) throw new NotFoundError('Paciente no encontrado')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no puede superar 10 MB' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const fileId = crypto.randomUUID()
    const fileName = `${fileId}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    await savePrivatePatientFile(id, fileName, buffer)

    const fileUrl = `/api/pacientes/${id}/documentos/${fileId}/file`

    const document = await prisma.patientDocument.create({
      data: {
        id: fileId,
        patientId: id,
        name: file.name,
        description: description || null,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: actor.userId,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    })

    const audit = getRequestAuditContext(request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'patient_document',
      entityId: document.id,
      ...audit,
      metadata: {
        patientId: id,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

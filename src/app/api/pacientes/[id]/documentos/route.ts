import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
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

    const { id } = await params

    const patient = await prisma.patient.findUnique({ where: { id, active: true } })
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

    const { id } = await params

    const patient = await prisma.patient.findUnique({ where: { id, active: true } })
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
    const uploadDir = join(process.cwd(), 'public', 'uploads', id)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, fileName), buffer)

    const fileUrl = `/uploads/${id}/${fileName}`

    const document = await prisma.patientDocument.create({
      data: {
        patientId: id,
        name: file.name,
        description: description || null,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: session!.user.id,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { z } from 'zod'

const createBackgroundSchema = z.object({
  type: z.enum(['PERSONAL', 'FAMILY', 'SURGICAL', 'PHARMACOLOGICAL', 'OBSTETRIC']),
  description: z.string().min(1, 'Descripción requerida'),
  date: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])

    const { id } = await params

    const patient = await prisma.patient.findUnique({ where: { id } })
    if (!patient) {
      throw new NotFoundError('Paciente no encontrado')
    }

    const body = await request.json()
    const parsed = createBackgroundSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const bg = await prisma.medicalBackground.create({
      data: {
        patientId: id,
        type: parsed.data.type,
        description: parsed.data.description,
        date: parsed.data.date ? new Date(parsed.data.date) : null,
        notes: parsed.data.notes || null,
      },
    })

    return NextResponse.json(bg, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

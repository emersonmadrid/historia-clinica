import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const createAllergySchema = z.object({
  allergen: z.string().min(1, 'Alérgeno requerido'),
  reaction: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).default('MILD'),
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
    const actor = await getActorContext(session)

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { organizationId: true },
    })
    requireSameOrganization(patient, actor.organizationId, (item) => item.organizationId, 'Paciente no encontrado')

    const body = await request.json()
    const parsed = createAllergySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const allergy = await prisma.allergy.create({
      data: {
        patientId: id,
        allergen: parsed.data.allergen,
        reaction: parsed.data.reaction || null,
        severity: parsed.data.severity,
        notes: parsed.data.notes || null,
      },
    })

    return NextResponse.json(allergy, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

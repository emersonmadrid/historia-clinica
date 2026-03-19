import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { updatePatientSchema } from '@/features/patients/schemas'
import { getPatientById } from '@/features/patients/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const patient = await getPatientById(id, actor.organizationId)

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params
    const body = await request.json()
    const parsed = updatePatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { birthDate, email, ...rest } = parsed.data

    const patient = await prisma.patient.update({
      where: { id, organizationId: actor.organizationId },
      data: {
        ...rest,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        ...(email === '' ? { email: null } : email !== undefined ? { email } : {}),
      },
    })

    const audit = getRequestAuditContext(request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PATIENT_UPDATED',
      entityType: 'patient',
      entityId: patient.id,
      ...audit,
    })

    return NextResponse.json(patient)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['DOCTOR', 'ADMIN'])
    const actor = await getActorContext(session)

    const { id } = await params

    await prisma.patient.update({
      where: { id, organizationId: actor.organizationId },
      data: { active: false },
    })

    const audit = getRequestAuditContext(_request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PATIENT_ARCHIVED',
      entityType: 'patient',
      entityId: id,
      ...audit,
    })

    return NextResponse.json({ message: 'Paciente eliminado correctamente' })
  } catch (error) {
    return handleApiError(error)
  }
}

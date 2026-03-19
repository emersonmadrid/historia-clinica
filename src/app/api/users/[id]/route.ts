import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, ConflictError } from '@/lib/errors'
import { updateUserSchema } from '@/features/users/schemas'
import bcrypt from 'bcryptjs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['ADMIN'])
    const actor = await getActorContext(session)

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
      },
    })

    requireSameOrganization(user, actor.organizationId, (item) => item.organizationId, 'Usuario no encontrado')

    return NextResponse.json(user)
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
    assertRole(session, ['ADMIN'])
    const actor = await getActorContext(session)

    const { id } = await params
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Don't allow admin to deactivate themselves
    if (data.active === false && id === session.user.id) {
      throw new ConflictError('No puedes desactivar tu propia cuenta')
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    })
    requireSameOrganization(existing, actor.organizationId, (item) => item.organizationId, 'Usuario no encontrado')

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.specialty !== undefined) updateData.specialty = data.specialty
    if (data.active !== undefined) updateData.active = data.active
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      data: updateData,
    })

    const audit = getRequestAuditContext(request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: user.id,
      ...audit,
      metadata: { role: user.role, active: user.active },
    })

    return NextResponse.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}

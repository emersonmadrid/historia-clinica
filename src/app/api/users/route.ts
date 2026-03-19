import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, ConflictError } from '@/lib/errors'
import { createUserSchema } from '@/features/users/schemas'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    if (all === 'true') {
      // Return all users (for admin user management)
      assertRole(session, ['ADMIN'])
      const users = await prisma.user.findMany({
        where: { organizationId: actor.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          specialty: true,
          active: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(users)
    }

    // Default: return doctors list (for selects), optionally filtered by specialty
    const specialtyFilter = new URL(request.url).searchParams.get('specialty')
    const doctors = await prisma.user.findMany({
      where: {
        organizationId: actor.organizationId,
        active: true,
        role: 'DOCTOR',
        ...(specialtyFilter && { specialty: specialtyFilter as never }),
      },
      select: { id: true, name: true, speciality: true, specialty: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['ADMIN'])
    const actor = await getActorContext(session)

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing?.organizationId === actor.organizationId) {
      throw new ConflictError('Ya existe un usuario con ese email')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        specialty: data.specialty ?? 'GENERAL_MEDICINE',
        organizationId: actor.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        active: true,
        createdAt: true,
      },
    })

    const audit = getRequestAuditContext(request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      ...audit,
      metadata: { role: user.role, email: user.email },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

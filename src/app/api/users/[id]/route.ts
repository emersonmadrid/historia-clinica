import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError, NotFoundError, ConflictError } from '@/lib/errors'
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

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        speciality: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundError('Usuario no encontrado')
    }

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

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundError('Usuario no encontrado')
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.speciality !== undefined) updateData.speciality = data.speciality
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
        speciality: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      data: updateData,
    })

    return NextResponse.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}

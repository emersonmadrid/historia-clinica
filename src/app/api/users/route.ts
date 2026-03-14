import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError, ConflictError } from '@/lib/errors'
import { createUserSchema } from '@/features/users/schemas'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    if (all === 'true') {
      // Return all users (for admin user management)
      assertRole(session, ['ADMIN'])
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          speciality: true,
          active: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(users)
    }

    // Default: return doctors list (for selects)
    const doctors = await prisma.user.findMany({
      select: { id: true, name: true, speciality: true },
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

    if (existing) {
      throw new ConflictError('Ya existe un usuario con ese email')
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        speciality: data.speciality || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        speciality: true,
        active: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

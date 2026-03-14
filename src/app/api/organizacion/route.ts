import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  ruc: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const org = await prisma.organization.findFirst()

    return NextResponse.json(org)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['ADMIN'])

    const body = await request.json()
    const parsed = updateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Upsert: update if exists, create if not
    const existing = await prisma.organization.findFirst()

    let org
    if (existing) {
      org = await prisma.organization.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          ruc: data.ruc || null,
          address: data.address || null,
          phone: data.phone || null,
        },
      })
    } else {
      org = await prisma.organization.create({
        data: {
          name: data.name,
          ruc: data.ruc || null,
          address: data.address || null,
          phone: data.phone || null,
        },
      })
    }

    return NextResponse.json(org)
  } catch (error) {
    return handleApiError(error)
  }
}

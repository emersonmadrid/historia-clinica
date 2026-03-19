import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  ruc: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const org = await prisma.organization.findUnique({ where: { id: actor.organizationId } })

    return NextResponse.json(org)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['ADMIN'])
    const actor = await getActorContext(session)

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
    const existing = await prisma.organization.findUnique({ where: { id: actor.organizationId } })

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
          id: actor.organizationId,
          name: data.name,
          ruc: data.ruc || null,
          address: data.address || null,
          phone: data.phone || null,
        },
      })
    }

    const audit = getRequestAuditContext(request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'organization',
      entityId: org.id,
      ...audit,
      metadata: {
        name: org.name,
        ruc: org.ruc,
      },
    })

    return NextResponse.json(org)
  } catch (error) {
    return handleApiError(error)
  }
}

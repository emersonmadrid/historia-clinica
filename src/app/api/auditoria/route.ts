import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth, assertRole } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/errors'
import { Prisma } from '@prisma/client'

interface AuditLogRow {
  id: string
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  metadata: Prisma.JsonValue | null
  createdAt: Date
  actorUserId: string | null
  actorUserName: string | null
  actorUserEmail: string | null
  actorUserRole: string | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    assertRole(session, ['ADMIN'])
    const actor = await getActorContext(session)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    const actionFilter = action ? Prisma.sql`AND l."action" = ${action}::"AuditAction"` : Prisma.empty
    const entityTypeFilter = entityType ? Prisma.sql`AND l."entityType" = ${entityType}` : Prisma.empty

    const logs = await prisma.$queryRaw<AuditLogRow[]>(
      Prisma.sql`
        SELECT
          l."id",
          l."action"::text AS "action",
          l."entityType",
          l."entityId",
          l."ipAddress",
          l."userAgent",
          l."metadata",
          l."createdAt",
          u."id" AS "actorUserId",
          u."name" AS "actorUserName",
          u."email" AS "actorUserEmail",
          u."role"::text AS "actorUserRole"
        FROM "audit_logs" l
        LEFT JOIN "users" u ON u."id" = l."actorUserId"
        WHERE l."organizationId" = ${actor.organizationId}
        ${actionFilter}
        ${entityTypeFilter}
        ORDER BY l."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `
    )

    const [countRow] = await prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS "total"
        FROM "audit_logs" l
        WHERE l."organizationId" = ${actor.organizationId}
        ${actionFilter}
        ${entityTypeFilter}
      `
    )

    const total = Number(countRow?.total ?? BigInt(0))

    const normalizedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
      createdAt: log.createdAt,
      actorUser: log.actorUserId
        ? {
            id: log.actorUserId,
            name: log.actorUserName ?? '',
            email: log.actorUserEmail ?? '',
            role: log.actorUserRole ?? '',
          }
        : null,
    }))

    return NextResponse.json({ logs: normalizedLogs, total, page, limit })
  } catch (error) {
    return handleApiError(error)
  }
}

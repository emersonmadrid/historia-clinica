import { Prisma } from '@prisma/client'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export type AuditAction =
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'PATIENT_ARCHIVED'
  | 'PATIENT_EXPORTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_DOWNLOADED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_STATUS_CHANGED'
  | 'APPOINTMENT_RSVP'
  | 'CONSULTATION_CREATED'
  | 'CONSULTATION_UPDATED'
  | 'PRESCRIPTION_CREATED'
  | 'PRESCRIPTION_DELETED'
  | 'PRESCRIPTION_EXPORTED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'ORGANIZATION_UPDATED'
  | 'LOGIN_SUCCEEDED'

interface AuditInput {
  organizationId: string
  actorUserId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}

export function getRequestAuditContext(request: Request | NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return {
    ipAddress: forwardedFor?.split(',')[0]?.trim() || realIp || null,
    userAgent: request.headers.get('user-agent'),
  }
}

export async function writeAuditLog(input: AuditInput) {
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "audit_logs" (
        "id",
        "organizationId",
        "actorUserId",
        "action",
        "entityType",
        "entityId",
        "ipAddress",
        "userAgent",
        "metadata",
        "createdAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${input.organizationId},
        ${input.actorUserId ?? null},
        ${input.action}::"AuditAction",
        ${input.entityType},
        ${input.entityId ?? null},
        ${input.ipAddress ?? null},
        ${input.userAgent ?? null},
        ${metadataJson ? Prisma.sql`${metadataJson}::jsonb` : Prisma.sql`NULL`},
        NOW()
      )
    `
  )
}

export function fireAndForgetAudit(input: AuditInput) {
  void writeAuditLog(input).catch((error) => {
    console.error('[audit-log]', error)
  })
}

import type { Prisma } from '@prisma/client'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ForbiddenError, NotFoundError, UnauthorizedError } from './errors'

type SessionUser = NonNullable<Session['user']> & {
  id: string
  role: string
  organizationId?: string | null
}

export interface ActorContext {
  userId: string
  role: SessionUser['role']
  organizationId: string
}

export async function getActorContext(session: Session | null): Promise<ActorContext> {
  if (!session?.user?.id) {
    throw new UnauthorizedError()
  }

  if (session.user.organizationId) {
    return {
      userId: session.user.id,
      role: session.user.role,
      organizationId: session.user.organizationId,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  })

  if (!user?.organizationId) {
    throw new ForbiddenError('El usuario no tiene una organización asignada')
  }

  return {
    userId: session.user.id,
    role: user.role,
    organizationId: user.organizationId,
  }
}

export function requireSameOrganization<T>(
  resource: T | null | undefined,
  organizationId: string,
  getResourceOrgId: (resource: T) => string | null | undefined,
  notFoundMessage: string
): T {
  if (!resource) {
    throw new NotFoundError(notFoundMessage)
  }

  if (getResourceOrgId(resource) !== organizationId) {
    throw new NotFoundError(notFoundMessage)
  }

  return resource
}

export function organizationFilter(
  organizationId: string
): Pick<Prisma.PatientWhereInput, 'organizationId'> {
  return { organizationId }
}

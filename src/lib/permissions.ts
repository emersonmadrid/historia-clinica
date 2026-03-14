import type { Session } from 'next-auth'
import type { Role } from '@prisma/client'
import { UnauthorizedError, ForbiddenError } from './errors'

type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']> & { id: string; role: Role }
}

/**
 * Verifica que exista una sesión activa.
 * Lanza UnauthorizedError si no hay sesión.
 */
export function assertAuth(session: Session | null): asserts session is AuthenticatedSession {
  if (!session?.user) {
    throw new UnauthorizedError()
  }
}

/**
 * Verifica que el usuario tenga uno de los roles indicados.
 * Lanza ForbiddenError si no tiene el rol requerido.
 */
export function assertRole(session: AuthenticatedSession, roles: Role[]): void {
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError()
  }
}

import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'
import type { Role, Specialty } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      organizationId?: string | null
      speciality?: string | null
      specialty?: Specialty | null
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    organizationId?: string | null
    speciality?: string | null
    specialty?: Specialty | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: Role
    organizationId?: string | null
    speciality?: string | null
    specialty?: Specialty | null
  }
}
